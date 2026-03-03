const express = require('express');
const { getDB } = require('../db');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Dashboard stats
router.get('/dashboard', authenticate, requireAdmin, (req, res) => {
  const db = getDB();

  const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  const activeToday = db.prepare("SELECT COUNT(*) as count FROM sessions_log WHERE date(login_at) = date('now')").get().count;
  const totalDeposits = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'deposit' AND status = 'completed'").get().total;
  const totalWithdrawals = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'withdrawal'").get().total;
  const pendingWithdrawals = db.prepare("SELECT COUNT(*) as count FROM transactions WHERE type = 'withdrawal' AND status = 'processing'").get().count;
  const fraudAlerts = db.prepare('SELECT COUNT(*) as count FROM fraud_events WHERE resolved = 0').get().count;
  const selfExcluded = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'self_excluded'").get().count;

  // Revenue (deposits - withdrawals)
  const revenue = totalDeposits - totalWithdrawals;

  // Recent transactions
  const recentTx = db.prepare(`
    SELECT t.*, u.username FROM transactions t
    JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC LIMIT 20
  `).all();

  // Recent fraud events
  const recentFraud = db.prepare('SELECT * FROM fraud_events WHERE resolved = 0 ORDER BY created_at DESC LIMIT 10').all();

  res.json({
    stats: { totalUsers, activeToday, totalDeposits, totalWithdrawals, pendingWithdrawals, revenue, fraudAlerts, selfExcluded },
    recentTransactions: recentTx,
    fraudAlerts: recentFraud,
  });
});

// User list
router.get('/users', authenticate, requireAdmin, (req, res) => {
  const db = getDB();
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;
  const search = req.query.search;

  let query = 'SELECT id, email, username, role, status, kyc_verified, created_at, last_login FROM users';
  let params = [];
  if (search) { query += ' WHERE email LIKE ? OR username LIKE ?'; params.push(`%${search}%`, `%${search}%`); }
  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const users = db.prepare(query).all(...params);
  const total = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  res.json({ users, total, limit, offset });
});

// Suspend / unsuspend user
router.put('/users/:id/status', authenticate, requireAdmin, (req, res) => {
  const { status } = req.body;
  if (!['active', 'suspended'].includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const db = getDB();
  db.prepare('UPDATE users SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json({ message: `User status updated to ${status}` });
});

// Resolve fraud alert
router.put('/fraud/:id/resolve', authenticate, requireAdmin, (req, res) => {
  const db = getDB();
  db.prepare('UPDATE fraud_events SET resolved = 1 WHERE id = ?').run(req.params.id);
  res.json({ message: 'Fraud alert resolved' });
});

module.exports = router;
