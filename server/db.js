const Database = require('better-sqlite3');
const path = require('path');

let db;

function getDB() {
  if (!db) {
    db = new Database(path.join(__dirname, 'casino.db'));
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initDB() {
  const d = getDB();

  d.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      totp_secret TEXT,
      totp_enabled INTEGER DEFAULT 0,
      role TEXT DEFAULT 'player',
      status TEXT DEFAULT 'active',
      kyc_verified INTEGER DEFAULT 0,
      gdpr_consent INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now')),
      last_login TEXT,
      login_attempts INTEGER DEFAULT 0,
      locked_until TEXT
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      currency TEXT DEFAULT 'USD',
      balance REAL DEFAULT 0,
      bonus_balance REAL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      wallet_id TEXT NOT NULL REFERENCES wallets(id),
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      status TEXT DEFAULT 'pending',
      payment_method TEXT,
      reference TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions_log (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      login_at TEXT DEFAULT (datetime('now')),
      logout_at TEXT,
      ip_address TEXT,
      user_agent TEXT,
      duration_minutes INTEGER
    );

    CREATE TABLE IF NOT EXISTS responsible_gaming (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      deposit_limit_daily REAL,
      deposit_limit_weekly REAL,
      deposit_limit_monthly REAL,
      session_timeout_minutes INTEGER DEFAULT 60,
      self_exclusion_until TEXT,
      reality_check_minutes INTEGER DEFAULT 30,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS fraud_events (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      event_type TEXT NOT NULL,
      severity TEXT DEFAULT 'low',
      details TEXT,
      ip_address TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      resolved INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS game_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      wallet_id TEXT NOT NULL REFERENCES wallets(id),
      external_tx_id TEXT UNIQUE,
      round_id TEXT,
      game_id TEXT,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      status TEXT DEFAULT 'completed',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      game_id TEXT NOT NULL,
      session_id TEXT,
      mode TEXT DEFAULT 'real',
      started_at TEXT DEFAULT (datetime('now')),
      ended_at TEXT,
      total_bet REAL DEFAULT 0,
      total_win REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS cached_games (
      external_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT,
      category TEXT,
      type TEXT,
      rtp REAL,
      volatility TEXT,
      thumbnail TEXT,
      has_demo INTEGER DEFAULT 0,
      is_new INTEGER DEFAULT 0,
      is_popular INTEGER DEFAULT 0,
      min_bet REAL,
      max_bet REAL,
      cached_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_game_tx_user ON game_transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_game_tx_round ON game_transactions(round_id);
    CREATE INDEX IF NOT EXISTS idx_game_tx_external ON game_transactions(external_tx_id);
    CREATE INDEX IF NOT EXISTS idx_game_sessions_user ON game_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_cached_games_type ON cached_games(type);
    CREATE INDEX IF NOT EXISTS idx_cached_games_provider ON cached_games(provider);

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
    CREATE INDEX IF NOT EXISTS idx_fraud_user ON fraud_events(user_id);
  `);

  console.log('✅ Database initialized');
}

module.exports = { getDB, initDB };
