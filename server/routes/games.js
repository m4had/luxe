/**
 * Game Routes — Catalog, Launch, and Aggregator Callbacks
 */

const express = require('express');
const { getDB } = require('../db');
const { authenticate } = require('../middleware/auth');
const gameAggregator = require('../services/gameAggregator');
const { WalletEngine, WalletError } = require('../services/walletEngine');

const router = express.Router();

// ─── Game Catalog ───────────────────────────────────────────────

/**
 * GET /api/v1/games/catalog
 * Fetches games from aggregator (cached locally for performance)
 */
router.get('/catalog', async (req, res) => {
  try {
    const { category, provider, search, limit = 50, offset = 0 } = req.query;
    const db = getDB();

    // Check cache (refresh every 6 hours)
    const cacheAge = db.prepare("SELECT MAX(cached_at) as latest FROM cached_games").get();
    const cacheExpired = !cacheAge.latest || (Date.now() - new Date(cacheAge.latest).getTime()) > 6 * 60 * 60 * 1000;

    if (cacheExpired) {
      try {
        const games = await gameAggregator.getGames({ limit: 5000 });
        const insert = db.prepare(`
          INSERT OR REPLACE INTO cached_games (external_id, name, provider, category, type, rtp, volatility, thumbnail, has_demo, is_new, is_popular, min_bet, max_bet, cached_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `);
        const batch = db.transaction((games) => {
          for (const g of games) {
            insert.run(g.id, g.name, g.provider, g.category, g.type, g.rtp, g.volatility, g.thumbnail, g.hasDemo ? 1 : 0, g.isNew ? 1 : 0, g.isPopular ? 1 : 0, g.minBet, g.maxBet);
          }
        });
        batch(games);
      } catch (err) {
        console.error('Game catalog sync failed:', err.message);
        // Fall through to cached data
      }
    }

    // Query local cache
    let query = 'SELECT * FROM cached_games WHERE 1=1';
    const params = [];

    if (category && category !== 'all') { query += ' AND (category = ? OR type = ?)'; params.push(category, category); }
    if (provider) { query += ' AND provider = ?'; params.push(provider); }
    if (search) { query += ' AND name LIKE ?'; params.push(`%${search}%`); }

    query += ' ORDER BY is_popular DESC, is_new DESC, name ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const games = db.prepare(query).all(...params);
    const total = db.prepare('SELECT COUNT(*) as count FROM cached_games').get().count;

    // Get unique providers for filter
    const providers = db.prepare('SELECT DISTINCT provider FROM cached_games ORDER BY provider').all().map(r => r.provider);

    res.json({ games, total, providers, limit: parseInt(limit), offset: parseInt(offset) });
  } catch (err) {
    console.error('Catalog error:', err);
    res.status(500).json({ error: 'Failed to fetch game catalog' });
  }
});

// ─── Game Launch ────────────────────────────────────────────────

/**
 * POST /api/v1/games/launch
 * Creates a game session and returns the iframe URL
 */
router.post('/launch', authenticate, async (req, res) => {
  try {
    const { gameId, mode = 'real' } = req.body;
    if (!gameId) return res.status(400).json({ error: 'gameId required' });

    const db = getDB();
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.userId);

    // Check self-exclusion
    const rg = db.prepare('SELECT * FROM responsible_gaming WHERE user_id = ?').get(req.userId);
    if (rg?.self_exclusion_until && new Date(rg.self_exclusion_until) > new Date()) {
      return res.status(403).json({ error: 'Account is self-excluded from gaming' });
    }

    // Check session timeout
    if (rg?.session_timeout_minutes) {
      const activeSession = db.prepare(`
        SELECT * FROM sessions_log WHERE user_id = ? AND logout_at IS NULL
        ORDER BY login_at DESC LIMIT 1
      `).get(req.userId);
      if (activeSession) {
        const elapsed = (Date.now() - new Date(activeSession.login_at).getTime()) / 60000;
        if (elapsed >= rg.session_timeout_minutes) {
          return res.status(400).json({ error: 'Session timeout reached. Take a break!', timeout: true });
        }
      }
    }

    // For real mode, check wallet balance
    if (mode === 'real') {
      const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(req.userId);
      if (!wallet || wallet.balance <= 0) {
        return res.status(400).json({ error: 'Insufficient balance. Please deposit funds first.' });
      }
    }

    const returnUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const result = await gameAggregator.launchGame({
      gameId,
      userId: req.userId,
      username: user.username,
      currency: 'USD',
      mode,
      returnUrl,
      ip: req.ip,
    });

    // Log game session
    db.prepare(`
      INSERT INTO game_sessions (id, user_id, game_id, session_id, mode, started_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `).run(require('uuid').v4(), req.userId, gameId, result.sessionId, mode);

    res.json(result);
  } catch (err) {
    console.error('Launch error:', err);
    res.status(500).json({ error: 'Failed to launch game' });
  }
});

// ─── Demo Launch (no auth required) ─────────────────────────────

router.post('/demo', async (req, res) => {
  try {
    const { gameId } = req.body;
    if (!gameId) return res.status(400).json({ error: 'gameId required' });

    const returnUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const result = await gameAggregator.launchGame({
      gameId,
      userId: 'demo-player',
      username: 'Demo',
      currency: 'USD',
      mode: 'demo',
      returnUrl,
      ip: req.ip,
    });

    res.json(result);
  } catch (err) {
    console.error('Demo launch error:', err);
    res.status(500).json({ error: 'Failed to launch demo' });
  }
});

// ─── Aggregator Callbacks ───────────────────────────────────────

/**
 * POST /api/v1/games/callback/:provider
 * 
 * This is the most critical endpoint — the aggregator calls this
 * for every bet, win, and refund to manage the player's wallet.
 */
router.post('/callback/:provider', (req, res) => {
  const { provider } = req.params;

  try {
    // Parse + verify the callback
    const normalized = gameAggregator.processCallback(provider, req.body, req.headers);

    // Process the wallet transaction
    const result = WalletEngine.processTransaction(normalized);

    // Respond in the format the aggregator expects
    switch (provider) {
      case 'softswiss':
        return res.json({ balance: Math.round(result.balance * 100), status: 'ok' }); // cents
      case 'everymatrix':
        return res.json({ Balance: result.balance, StatusCode: 0, StatusMessage: 'OK' });
      case 'betconstruct':
        return res.json({ balance: result.balance, status: 'success', error_code: 0 });
      default:
        return res.json({ balance: result.balance, status: 'ok' });
    }
  } catch (err) {
    console.error(`Callback error (${provider}):`, err);

    // Error responses per aggregator
    const errorMap = {
      INSUFFICIENT_FUNDS: { http: 200, code: 'INSUFFICIENT_FUNDS' },
      USER_NOT_FOUND: { http: 200, code: 'USER_NOT_FOUND' },
      USER_BLOCKED: { http: 200, code: 'USER_BLOCKED' },
    };

    const mapped = errorMap[err.code] || { http: 500, code: 'INTERNAL_ERROR' };

    switch (provider) {
      case 'softswiss':
        return res.status(mapped.http).json({ status: 'error', error: err.code || 'INTERNAL_ERROR' });
      case 'everymatrix':
        return res.status(mapped.http).json({ StatusCode: 1, StatusMessage: err.message });
      case 'betconstruct':
        return res.status(mapped.http).json({ status: 'error', error_code: 1, error_message: err.message });
      default:
        return res.status(500).json({ error: err.message });
    }
  }
});

// ─── Game History ───────────────────────────────────────────────

router.get('/history', authenticate, (req, res) => {
  const { limit = 50, offset = 0 } = req.query;
  const history = WalletEngine.getRoundHistory(req.userId, { limit: parseInt(limit), offset: parseInt(offset) });
  res.json({ history });
});

// ─── Active Game Session Check ──────────────────────────────────

router.get('/session-check', authenticate, (req, res) => {
  const db = getDB();
  const rg = db.prepare('SELECT * FROM responsible_gaming WHERE user_id = ?').get(req.userId);

  if (!rg) return res.json({ ok: true });

  const session = db.prepare(`
    SELECT * FROM sessions_log WHERE user_id = ? AND logout_at IS NULL ORDER BY login_at DESC LIMIT 1
  `).get(req.userId);

  if (session && rg.session_timeout_minutes) {
    const elapsed = (Date.now() - new Date(session.login_at).getTime()) / 60000;
    const remaining = rg.session_timeout_minutes - elapsed;

    if (remaining <= 0) {
      return res.json({ ok: false, reason: 'timeout', message: 'Session timeout reached' });
    }
    if (remaining <= 5) {
      return res.json({ ok: true, warning: true, minutesRemaining: Math.ceil(remaining) });
    }
  }

  // Reality check
  if (rg.reality_check_minutes && session) {
    const elapsed = (Date.now() - new Date(session.login_at).getTime()) / 60000;
    if (elapsed > 0 && elapsed % rg.reality_check_minutes < 1) {
      return res.json({ ok: true, realityCheck: true, minutesPlayed: Math.floor(elapsed) });
    }
  }

  res.json({ ok: true });
});

module.exports = router;
