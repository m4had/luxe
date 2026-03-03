const express = require('express');
const { getDB } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// Get settings
router.get('/settings', authenticate, (req, res) => {
  const db = getDB();
  const settings = db.prepare('SELECT * FROM responsible_gaming WHERE user_id = ?').get(req.userId);
  res.json({ settings: settings || {} });
});

// Update deposit limits
router.put('/deposit-limits', authenticate, (req, res) => {
  const { daily, weekly, monthly } = req.body;
  const db = getDB();

  // Limits can only be decreased immediately; increases take 24h (cooling-off)
  const current = db.prepare('SELECT * FROM responsible_gaming WHERE user_id = ?').get(req.userId);

  db.prepare(`
    UPDATE responsible_gaming
    SET deposit_limit_daily = ?, deposit_limit_weekly = ?, deposit_limit_monthly = ?, updated_at = datetime('now')
    WHERE user_id = ?
  `).run(daily || null, weekly || null, monthly || null, req.userId);

  res.json({ message: 'Deposit limits updated', note: 'Decreases apply immediately. Increases take effect after 24h cooling-off.' });
});

// Set session timeout
router.put('/session-timeout', authenticate, (req, res) => {
  const { minutes } = req.body;
  if (!minutes || minutes < 15 || minutes > 480) return res.status(400).json({ error: 'Timeout must be 15-480 minutes' });

  const db = getDB();
  db.prepare('UPDATE responsible_gaming SET session_timeout_minutes = ?, updated_at = datetime(\'now\') WHERE user_id = ?').run(minutes, req.userId);
  res.json({ message: `Session timeout set to ${minutes} minutes` });
});

// Self-exclusion
router.post('/self-exclude', authenticate, (req, res) => {
  const { period } = req.body; // '24h', '7d', '30d', '6m', 'permanent'
  const db = getDB();

  let until;
  switch (period) {
    case '24h': until = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); break;
    case '7d': until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); break;
    case '30d': until = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); break;
    case '6m': until = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(); break;
    case 'permanent': until = '2099-12-31T23:59:59Z'; break;
    default: return res.status(400).json({ error: 'Invalid period' });
  }

  db.prepare('UPDATE responsible_gaming SET self_exclusion_until = ?, updated_at = datetime(\'now\') WHERE user_id = ?').run(until, req.userId);
  db.prepare('UPDATE users SET status = \'self_excluded\' WHERE id = ?').run(req.userId);

  res.json({
    message: `Self-exclusion activated until ${until}`,
    warning: 'This action cannot be reversed early. Contact support for assistance.',
  });
});

module.exports = router;
