# 🎰 LuxeBet — Premium Online Casino Platform

A professional, high-conversion online casino platform with mobile-first dark-mode design.

## Architecture

```
casino-platform/
├── src/                          # Next.js Frontend
│   ├── app/
│   │   ├── layout.jsx            # Root layout (dark theme)
│   │   ├── page.jsx              # Landing page
│   │   ├── globals.css           # Tailwind + custom animations
│   │   └── admin/
│   │       └── page.jsx          # Admin dashboard
│   └── components/
│       ├── layout/
│       │   ├── Navbar.jsx        # Nav + Auth Modal (signup/login/2FA)
│       │   └── Footer.jsx        # Site footer
│       └── landing/
│           ├── HeroSection.jsx   # Hero with stats + CTAs
│           ├── GameGrid.jsx      # Lazy-loaded game grid (RTP/volatility badges)
│           ├── CrashGamePreview.jsx  # Live crash game with multiplier
│           ├── LiveDealerSection.jsx # Live dealer table cards
│           ├── SignUpPromo.jsx   # "Sign Up in 60 Seconds" block
│           ├── PaymentMethods.jsx # Payment options display
│           └── ResponsibleGaming.jsx # Player protection tools
├── server/                       # Express Backend
│   ├── index.js                  # Server entry (helmet, CORS, rate limiting)
│   ├── db.js                     # SQLite schema + init
│   ├── routes/
│   │   ├── auth.js               # Register, Login, 2FA, GDPR export/delete
│   │   ├── wallet.js             # Deposits, withdrawals, transaction history
│   │   ├── admin.js              # Dashboard stats, user management, fraud
│   │   └── responsible.js        # Deposit limits, session timeout, self-exclusion
│   └── middleware/
│       ├── auth.js               # JWT authentication + admin guard
│       └── fraud.js              # Automated fraud detection
├── tailwind.config.js
├── next.config.js
└── package.json
```

## Features

### Frontend
- **Mobile-first** responsive design with dark-mode aesthetic
- **Micro-animations** via Framer Motion (hover effects, slide-ups, floating elements)
- **Lazy-loaded game grid** with IntersectionObserver
- **RTP & volatility badges** on every game card
- **Live crash game** with real-time multiplier animation
- **Live dealer section** with active table cards
- **"Sign Up in 60 Seconds"** conversion promo block

### Authentication & Security
- **Registration** with bcrypt password hashing (12 rounds)
- **2FA** via TOTP (Google Authenticator compatible) with QR code
- **JWT tokens** with 24h expiry
- **Account lockout** after 5 failed login attempts (15 min)
- **Rate limiting** (30 requests/min per IP)
- **Helmet.js** security headers
- **SSL-ready** architecture

### Wallet System
- **Deposit/withdrawal** with balance management
- **Deposit limit enforcement** (daily/weekly/monthly)
- **KYC gate** for withdrawals >$2,000
- **Transaction history** with pagination
- **Multi-currency** support (USD + crypto ready)

### Payment Gateway
- Supports credit cards, e-wallets (Skrill/Neteller), crypto (BTC, ETH, USDT, LTC)
- Stripe integration point in wallet routes
- Instant crypto deposit architecture

### Responsible Gaming
- **Deposit limits** — daily, weekly, monthly (decreases instant, increases 24h cooldown)
- **Session time-outs** — configurable 15-480 minutes
- **Self-exclusion** — 24h, 7d, 30d, 6m, permanent (irreversible)
- **Reality checks** at configurable intervals

### Fraud Detection
- **Rapid request detection** on sensitive endpoints
- **Brute force protection** on login
- **Betting pattern analysis** (frequency + amount anomalies)
- **Event logging** with severity levels
- **Admin resolution** workflow

### GDPR Compliance
- **Data export** endpoint (all user data in JSON)
- **Account deletion** with full data purge
- **Consent tracking** in user model

### Admin Dashboard
- Real-time stats (users, deposits, revenue, fraud alerts)
- Recent transaction feed
- Fraud alert panel with resolution
- User search and status management

## Quick Start

```bash
npm install
npm run dev:all    # Starts Next.js (3000) + Express API (4000)
```

## Environment Variables

```env
JWT_SECRET=your-secret-key
PORT=4000
FRONTEND_URL=http://localhost:3000
STRIPE_SECRET_KEY=sk_test_...
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, Tailwind CSS, Framer Motion |
| Backend | Express.js, JWT, bcrypt, speakeasy (TOTP) |
| Database | SQLite (better-sqlite3) — swap for PostgreSQL in prod |
| Security | Helmet, CORS, rate limiting, fraud detection |
| Payments | Stripe (cards), crypto integration points |

---

⚠️ **Disclaimer**: This is a demonstration platform. Operating a real online casino requires proper licensing, regulatory compliance, and professional security audits.
