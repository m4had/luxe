const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { v4: uuid } = require('uuid');
const { getDB } = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production-' + require('crypto').randomBytes(16).toString('hex');
const JWT_EXPIRY = '24h';

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;
    if (!email || !password || !username) return res.status(400).json({ error: 'All fields required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) return res.status(400).json({ error: 'Invalid username (3-20 alphanumeric chars)' });

    const db = getDB();
    const existing = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username);
    if (existing) return res.status(409).json({ error: 'Email or username already taken' });

    const id = uuid();
    const password_hash = await bcrypt.hash(password, 12);

    // Generate TOTP secret
    const secret = speakeasy.generateSecret({ name: `LuxeBet (${email})`, issuer: 'LuxeBet' });
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

    db.prepare(`
      INSERT INTO users (id, email, username, password_hash, totp_secret)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, email.toLowerCase(), username, password_hash, secret.base32);

    // Create wallet
    db.prepare('INSERT INTO wallets (id, user_id, currency, balance) VALUES (?, ?, ?, ?)').run(uuid(), id, 'USD', 0);

    // Create responsible gaming defaults
    db.prepare(`
      INSERT INTO responsible_gaming (id, user_id, session_timeout_minutes, reality_check_minutes)
      VALUES (?, ?, 60, 30)
    `).run(uuid(), id);

    res.status(201).json({
      message: 'Account created. Set up 2FA to secure your account.',
      qrCode,
      userId: id,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const db = getDB();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    // Check lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      return res.status(423).json({ error: 'Account temporarily locked. Try again later.' });
    }

    // Check status
    if (user.status === 'suspended') return res.status(403).json({ error: 'Account suspended' });
    if (user.status === 'self_excluded') return res.status(403).json({ error: 'Account self-excluded. Contact support.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const attempts = (user.login_attempts || 0) + 1;
      const updates = { attempts };
      if (attempts >= 5) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        db.prepare('UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?').run(attempts, lockUntil, user.id);
      } else {
        db.prepare('UPDATE users SET login_attempts = ? WHERE id = ?').run(attempts, user.id);
      }
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset login attempts
    db.prepare('UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = datetime(\'now\') WHERE id = ?').run(user.id);

    // Check if 2FA enabled
    if (user.totp_enabled) {
      return res.json({ requires2FA: true, message: 'Enter your 2FA code' });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    // Log session
    db.prepare('INSERT INTO sessions_log (id, user_id, ip_address, user_agent) VALUES (?, ?, ?, ?)').run(
      uuid(), user.id, req.ip, req.headers['user-agent']
    );

    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Verify 2FA
router.post('/verify-2fa', (req, res) => {
  const { email, token: totpToken } = req.body;
  if (!email || !totpToken) return res.status(400).json({ error: 'Email and 2FA code required' });

  const db = getDB();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const verified = speakeasy.totp.verify({ secret: user.totp_secret, encoding: 'base32', token: totpToken, window: 1 });
  if (!verified) return res.status(401).json({ error: 'Invalid 2FA code' });

  const jwtToken = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

  db.prepare('INSERT INTO sessions_log (id, user_id, ip_address, user_agent) VALUES (?, ?, ?, ?)').run(
    uuid(), user.id, req.ip, req.headers['user-agent']
  );

  res.json({ token: jwtToken, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
});

// Enable 2FA
router.post('/enable-2fa', authenticate, (req, res) => {
  const { token: totpToken } = req.body;
  const db = getDB();
  const user = db.prepare('SELECT totp_secret FROM users WHERE id = ?').get(req.userId);

  const verified = speakeasy.totp.verify({ secret: user.totp_secret, encoding: 'base32', token: totpToken, window: 1 });
  if (!verified) return res.status(400).json({ error: 'Invalid code. Try again.' });

  db.prepare('UPDATE users SET totp_enabled = 1 WHERE id = ?').run(req.userId);
  res.json({ message: '2FA enabled successfully' });
});

// Get profile
router.get('/profile', authenticate, (req, res) => {
  const db = getDB();
  const user = db.prepare('SELECT id, email, username, role, status, kyc_verified, totp_enabled, created_at FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// GDPR: Export data
router.get('/gdpr/export', authenticate, (req, res) => {
  const db = getDB();
  const user = db.prepare('SELECT id, email, username, created_at, last_login FROM users WHERE id = ?').get(req.userId);
  const wallet = db.prepare('SELECT currency, balance, bonus_balance FROM wallets WHERE user_id = ?').all(req.userId);
  const transactions = db.prepare('SELECT type, amount, currency, status, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 100').all(req.userId);
  const sessions = db.prepare('SELECT login_at, ip_address FROM sessions_log WHERE user_id = ? ORDER BY login_at DESC LIMIT 50').all(req.userId);

  res.json({ user, wallet, transactions, sessions, exportedAt: new Date().toISOString() });
});

// GDPR: Delete account
router.delete('/gdpr/delete', authenticate, async (req, res) => {
  const db = getDB();
  const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(req.userId);
  if (wallet && wallet.balance > 0) return res.status(400).json({ error: 'Withdraw remaining balance before deleting account' });

  db.prepare('DELETE FROM sessions_log WHERE user_id = ?').run(req.userId);
  db.prepare('DELETE FROM responsible_gaming WHERE user_id = ?').run(req.userId);
  db.prepare('DELETE FROM transactions WHERE user_id = ?').run(req.userId);
  db.prepare('DELETE FROM wallets WHERE user_id = ?').run(req.userId);
  db.prepare('DELETE FROM users WHERE id = ?').run(req.userId);

  res.json({ message: 'Account and all associated data permanently deleted' });
});

module.exports = router;
module.exports.JWT_SECRET = JWT_SECRET;
