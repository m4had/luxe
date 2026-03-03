const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { initDB } = require('./db');
const authRoutes = require('./routes/auth');
const walletRoutes = require('./routes/wallet');
const adminRoutes = require('./routes/admin');
const responsibleRoutes = require('./routes/responsible');
const gameRoutes = require('./routes/games');
const { fraudDetection } = require('./middleware/fraud');

const app = express();
const PORT = process.env.PORT || 4000;

// Security
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());

// Rate limiting
const { RateLimiterMemory } = require('rate-limiter-flexible');
const rateLimiter = new RateLimiterMemory({ points: 30, duration: 60 });
app.use(async (req, res, next) => {
  try { await rateLimiter.consume(req.ip); next(); }
  catch { res.status(429).json({ error: 'Too many requests' }); }
});

// Fraud detection middleware
app.use('/api/v1', fraudDetection);

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/wallet', walletRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/responsible', responsibleRoutes);
app.use('/api/v1/games', gameRoutes);

// Health
app.get('/api/v1/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Init
initDB();
app.listen(PORT, () => console.log(`🎰 Casino API running on port ${PORT}`));
