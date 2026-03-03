const { v4: uuid } = require('uuid');

// In-memory tracking for fraud detection
const requestLog = new Map(); // ip -> [{ timestamp, endpoint }]
const suspiciousPatterns = new Map(); // userId -> { rapidBets, unusualAmounts, multipleIPs }

function fraudDetection(req, res, next) {
  const ip = req.ip;
  const now = Date.now();

  // Track request patterns per IP
  if (!requestLog.has(ip)) requestLog.set(ip, []);
  const logs = requestLog.get(ip);
  logs.push({ timestamp: now, endpoint: req.path });

  // Clean old entries (keep last 5 minutes)
  const cutoff = now - 5 * 60 * 1000;
  const recent = logs.filter((l) => l.timestamp > cutoff);
  requestLog.set(ip, recent);

  // Flag rapid successive requests to sensitive endpoints
  const sensitiveEndpoints = ['/wallet/deposit', '/wallet/withdraw', '/auth/login'];
  const sensitiveRecent = recent.filter(
    (l) => sensitiveEndpoints.some((e) => l.endpoint.includes(e)) && l.timestamp > now - 60000
  );

  if (sensitiveRecent.length > 10) {
    logFraudEvent(null, 'rapid_requests', 'high', `${sensitiveRecent.length} requests in 60s from ${ip}`, ip);
  }

  // Multiple failed logins
  const loginAttempts = recent.filter((l) => l.endpoint.includes('/auth/login'));
  if (loginAttempts.length > 5) {
    logFraudEvent(null, 'brute_force_attempt', 'high', `${loginAttempts.length} login attempts from ${ip}`, ip);
  }

  next();
}

function logFraudEvent(userId, eventType, severity, details, ip) {
  try {
    const { getDB } = require('../db');
    const db = getDB();
    db.prepare('INSERT INTO fraud_events (id, user_id, event_type, severity, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)').run(
      uuid(), userId, eventType, severity, details, ip
    );
  } catch (err) {
    console.error('Fraud log error:', err.message);
  }
}

// Check for suspicious betting patterns
function checkBettingPattern(userId, amount, gameType) {
  if (!suspiciousPatterns.has(userId)) {
    suspiciousPatterns.set(userId, { bets: [], ips: new Set() });
  }
  const pattern = suspiciousPatterns.get(userId);
  pattern.bets.push({ amount, gameType, timestamp: Date.now() });

  // Keep last 100 bets
  if (pattern.bets.length > 100) pattern.bets = pattern.bets.slice(-100);

  const recentBets = pattern.bets.filter((b) => b.timestamp > Date.now() - 60000);

  // Rapid betting (>20 bets/minute)
  if (recentBets.length > 20) {
    logFraudEvent(userId, 'rapid_betting', 'medium', `${recentBets.length} bets in 60s`, null);
    return { flagged: true, reason: 'Unusual betting frequency detected' };
  }

  // Sudden large amount increase
  const avgAmount = pattern.bets.reduce((s, b) => s + b.amount, 0) / pattern.bets.length;
  if (amount > avgAmount * 10 && pattern.bets.length > 5) {
    logFraudEvent(userId, 'unusual_amount', 'medium', `Bet $${amount} vs avg $${avgAmount.toFixed(2)}`, null);
    return { flagged: true, reason: 'Unusual bet amount detected' };
  }

  return { flagged: false };
}

module.exports = { fraudDetection, checkBettingPattern, logFraudEvent };
