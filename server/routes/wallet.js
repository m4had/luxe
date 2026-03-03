const express = require('express');
const { v4: uuid } = require('uuid');
const { getDB } = require('../db');
const { authenticate } = require('../middleware/auth');
const { checkBettingPattern } = require('../middleware/fraud');

const router = express.Router();

// Get wallet balance
router.get('/balance', authenticate, (req, res) => {
  const db = getDB();
  const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(req.userId);
  if (!wallet) return res.status(404).json({ error: 'Wallet not found' });

  const rg = db.prepare('SELECT * FROM responsible_gaming WHERE user_id = ?').get(req.userId);
  res.json({ wallet, responsibleGaming: rg });
});

// Deposit
router.post('/deposit', authenticate, async (req, res) => {
  try {
    const { amount, currency = 'USD', paymentMethod } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });
    if (amount > 50000) return res.status(400).json({ error: 'Maximum deposit is $50,000' });

    const db = getDB();

    // Check deposit limits
    const rg = db.prepare('SELECT * FROM responsible_gaming WHERE user_id = ?').get(req.userId);
    if (rg) {
      if (rg.self_exclusion_until && new Date(rg.self_exclusion_until) > new Date()) {
        return res.status(403).json({ error: 'Account is self-excluded' });
      }

      // Check daily limit
      if (rg.deposit_limit_daily) {
        const todayDeposits = db.prepare(`
          SELECT COALESCE(SUM(amount), 0) as total FROM transactions
          WHERE user_id = ? AND type = 'deposit' AND status = 'completed'
          AND date(created_at) = date('now')
        `).get(req.userId);
        if (todayDeposits.total + amount > rg.deposit_limit_daily) {
          return res.status(400).json({ error: `Daily deposit limit ($${rg.deposit_limit_daily}) would be exceeded` });
        }
      }

      // Check weekly limit
      if (rg.deposit_limit_weekly) {
        const weekDeposits = db.prepare(`
          SELECT COALESCE(SUM(amount), 0) as total FROM transactions
          WHERE user_id = ? AND type = 'deposit' AND status = 'completed'
          AND created_at >= datetime('now', '-7 days')
        `).get(req.userId);
        if (weekDeposits.total + amount > rg.deposit_limit_weekly) {
          return res.status(400).json({ error: `Weekly deposit limit ($${rg.deposit_limit_weekly}) would be exceeded` });
        }
      }
    }

    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(req.userId);
    const txId = uuid();

    // In production: integrate with Stripe / crypto processor here
    // For now, simulate successful deposit
    db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?').run(amount, wallet.id);
    db.prepare(`
      INSERT INTO transactions (id, user_id, wallet_id, type, amount, currency, status, payment_method)
      VALUES (?, ?, ?, 'deposit', ?, ?, 'completed', ?)
    `).run(txId, req.userId, wallet.id, amount, currency, paymentMethod || 'card');

    const updated = db.prepare('SELECT balance, bonus_balance FROM wallets WHERE id = ?').get(wallet.id);
    res.json({ message: 'Deposit successful', transaction: txId, balance: updated.balance });
  } catch (err) {
    console.error('Deposit error:', err);
    res.status(500).json({ error: 'Deposit failed' });
  }
});

// Withdraw
router.post('/withdraw', authenticate, async (req, res) => {
  try {
    const { amount, paymentMethod } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const db = getDB();
    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(req.userId);
    if (wallet.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });

    // KYC check for large withdrawals
    if (amount > 2000) {
      const user = db.prepare('SELECT kyc_verified FROM users WHERE id = ?').get(req.userId);
      if (!user.kyc_verified) {
        return res.status(400).json({ error: 'KYC verification required for withdrawals over $2,000' });
      }
    }

    const txId = uuid();
    db.prepare('UPDATE wallets SET balance = balance - ? WHERE id = ?').run(amount, wallet.id);
    db.prepare(`
      INSERT INTO transactions (id, user_id, wallet_id, type, amount, currency, status, payment_method)
      VALUES (?, ?, ?, 'withdrawal', ?, 'USD', 'processing', ?)
    `).run(txId, req.userId, wallet.id, amount, paymentMethod || 'card');

    const updated = db.prepare('SELECT balance FROM wallets WHERE id = ?').get(wallet.id);
    res.json({ message: 'Withdrawal initiated', transaction: txId, balance: updated.balance });
  } catch (err) {
    console.error('Withdraw error:', err);
    res.status(500).json({ error: 'Withdrawal failed' });
  }
});

// Transaction history
router.get('/transactions', authenticate, (req, res) => {
  const db = getDB();
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = parseInt(req.query.offset) || 0;

  const transactions = db.prepare(`
    SELECT id, type, amount, currency, status, payment_method, created_at
    FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(req.userId, limit, offset);

  const total = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE user_id = ?').get(req.userId);
  res.json({ transactions, total: total.count, limit, offset });
});

module.exports = router;
