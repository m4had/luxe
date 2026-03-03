/**
 * Wallet Engine — Handles real-money transactions from game aggregators
 * 
 * This is the core of the casino: aggregators call your callback URL
 * to debit (bet) and credit (win) the player's wallet in real-time.
 * 
 * CRITICAL: All operations must be atomic and idempotent.
 */

const { v4: uuid } = require('uuid');
const { getDB } = require('../db');
const { logFraudEvent } = require('../middleware/fraud');

class WalletEngine {
  /**
   * Process a game transaction (bet, win, refund)
   * Called by the aggregator callback handler
   */
  processTransaction({ action, userId, transactionId, roundId, gameId, amount, currency }) {
    const db = getDB();

    // Idempotency: check if transaction already processed
    const existing = db.prepare('SELECT id, status FROM game_transactions WHERE external_tx_id = ?').get(transactionId);
    if (existing) {
      const wallet = db.prepare('SELECT balance FROM wallets WHERE user_id = ?').get(userId);
      return { success: true, balance: wallet.balance, alreadyProcessed: true };
    }

    // Get user + wallet
    const user = db.prepare('SELECT id, status FROM users WHERE id = ?').get(userId);
    if (!user) throw new WalletError('USER_NOT_FOUND', 'Player not found');
    if (user.status === 'suspended') throw new WalletError('USER_BLOCKED', 'Account suspended');
    if (user.status === 'self_excluded') throw new WalletError('USER_BLOCKED', 'Account self-excluded');

    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
    if (!wallet) throw new WalletError('WALLET_NOT_FOUND', 'Wallet not found');

    // Check session timeout
    const rg = db.prepare('SELECT * FROM responsible_gaming WHERE user_id = ?').get(userId);
    if (rg && rg.self_exclusion_until && new Date(rg.self_exclusion_until) > new Date()) {
      throw new WalletError('USER_BLOCKED', 'Self-exclusion active');
    }

    switch (action) {
      case 'balance':
        return { success: true, balance: wallet.balance };

      case 'bet':
        return this._processBet(db, wallet, { transactionId, roundId, gameId, amount, currency, userId });

      case 'win':
        return this._processWin(db, wallet, { transactionId, roundId, gameId, amount, currency, userId });

      case 'refund':
        return this._processRefund(db, wallet, { transactionId, roundId, gameId, amount, currency, userId });

      default:
        throw new WalletError('UNKNOWN_ACTION', `Unknown action: ${action}`);
    }
  }

  _processBet(db, wallet, { transactionId, roundId, gameId, amount, currency, userId }) {
    if (amount <= 0) throw new WalletError('INVALID_AMOUNT', 'Bet amount must be positive');
    if (wallet.balance < amount) throw new WalletError('INSUFFICIENT_FUNDS', 'Insufficient balance');

    // Atomic: debit + record
    const txn = db.transaction(() => {
      db.prepare('UPDATE wallets SET balance = balance - ? WHERE id = ?').run(amount, wallet.id);
      db.prepare(`
        INSERT INTO game_transactions (id, user_id, wallet_id, external_tx_id, round_id, game_id, type, amount, currency, status)
        VALUES (?, ?, ?, ?, ?, ?, 'bet', ?, ?, 'completed')
      `).run(uuid(), userId, wallet.id, transactionId, roundId, gameId, amount, currency);
    });
    txn();

    const updated = db.prepare('SELECT balance FROM wallets WHERE id = ?').get(wallet.id);

    // Fraud check: rapid bets
    const recentBets = db.prepare(`
      SELECT COUNT(*) as count FROM game_transactions
      WHERE user_id = ? AND type = 'bet' AND created_at >= datetime('now', '-1 minute')
    `).get(userId);
    if (recentBets.count > 30) {
      logFraudEvent(userId, 'rapid_game_bets', 'high', `${recentBets.count} bets in 60s on ${gameId}`, null);
    }

    return { success: true, balance: updated.balance };
  }

  _processWin(db, wallet, { transactionId, roundId, gameId, amount, currency, userId }) {
    if (amount < 0) throw new WalletError('INVALID_AMOUNT', 'Win amount cannot be negative');

    const txn = db.transaction(() => {
      if (amount > 0) {
        db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?').run(amount, wallet.id);
      }
      db.prepare(`
        INSERT INTO game_transactions (id, user_id, wallet_id, external_tx_id, round_id, game_id, type, amount, currency, status)
        VALUES (?, ?, ?, ?, ?, ?, 'win', ?, ?, 'completed')
      `).run(uuid(), userId, wallet.id, transactionId, roundId, gameId, amount, currency);
    });
    txn();

    const updated = db.prepare('SELECT balance FROM wallets WHERE id = ?').get(wallet.id);

    // Fraud check: large wins
    if (amount > 10000) {
      logFraudEvent(userId, 'large_win', 'medium', `Won $${amount} on ${gameId} (round ${roundId})`, null);
    }

    return { success: true, balance: updated.balance };
  }

  _processRefund(db, wallet, { transactionId, roundId, gameId, amount, currency, userId }) {
    // Find original bet to refund
    const originalBet = db.prepare(`
      SELECT * FROM game_transactions WHERE round_id = ? AND user_id = ? AND type = 'bet' AND status = 'completed'
    `).get(roundId, userId);

    const refundAmount = amount || (originalBet ? originalBet.amount : 0);

    const txn = db.transaction(() => {
      if (refundAmount > 0) {
        db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?').run(refundAmount, wallet.id);
      }
      db.prepare(`
        INSERT INTO game_transactions (id, user_id, wallet_id, external_tx_id, round_id, game_id, type, amount, currency, status)
        VALUES (?, ?, ?, ?, ?, ?, 'refund', ?, ?, 'completed')
      `).run(uuid(), userId, wallet.id, transactionId, roundId, gameId, refundAmount, currency);

      // Mark original bet as refunded
      if (originalBet) {
        db.prepare("UPDATE game_transactions SET status = 'refunded' WHERE id = ?").run(originalBet.id);
      }
    });
    txn();

    const updated = db.prepare('SELECT balance FROM wallets WHERE id = ?').get(wallet.id);
    return { success: true, balance: updated.balance };
  }

  /**
   * Get round history for a user
   */
  getRoundHistory(userId, { limit = 50, offset = 0 } = {}) {
    const db = getDB();
    return db.prepare(`
      SELECT gt.*, g.name as game_name FROM game_transactions gt
      LEFT JOIN cached_games g ON gt.game_id = g.external_id
      WHERE gt.user_id = ? ORDER BY gt.created_at DESC LIMIT ? OFFSET ?
    `).all(userId, limit, offset);
  }
}

class WalletError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

module.exports = { WalletEngine: new WalletEngine(), WalletError };
