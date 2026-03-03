'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const navLinks = [
  { label: 'Slots', href: '#slots' },
  { label: 'Live Casino', href: '#live' },
  { label: 'Crash', href: '#crash' },
  { label: 'Promotions', href: '#promo' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  return (
    <>
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-casino-accent to-casino-purple flex items-center justify-center font-black text-white text-sm">
              LB
            </div>
            <span className="text-xl font-bold text-gradient">LuxeBet</span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((l) => (
              <a key={l.label} href={l.href} className="text-sm text-gray-300 hover:text-casino-accent transition-colors">
                {l.label}
              </a>
            ))}
          </div>

          {/* CTA */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => setShowAuth(true)}
              className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => setShowAuth(true)}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-casino-accent to-yellow-500 text-black hover:shadow-lg hover:shadow-casino-accent/25 transition-all"
            >
              Sign Up
            </button>
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden text-gray-300" onClick={() => setOpen(!open)}>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden bg-casino-darker border-t border-white/5"
            >
              <div className="px-4 py-4 space-y-3">
                {navLinks.map((l) => (
                  <a key={l.label} href={l.href} className="block text-gray-300 hover:text-casino-accent py-2">{l.label}</a>
                ))}
                <button
                  onClick={() => { setShowAuth(true); setOpen(false); }}
                  className="w-full py-3 mt-2 rounded-lg bg-gradient-to-r from-casino-accent to-yellow-500 text-black font-semibold"
                >
                  Sign Up Now
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Auth Modal */}
      <AnimatePresence>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </AnimatePresence>
    </>
  );
}

function AuthModal({ onClose }) {
  const [mode, setMode] = useState('signup'); // signup | login | 2fa
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', username: '' });
  const [twoFA, setTwoFA] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (form.password !== form.confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
        if (form.password.length < 8) { setError('Password must be at least 8 characters'); setLoading(false); return; }
        const res = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password, username: form.username }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        if (data.qrCode) { setQrCode(data.qrCode); setMode('2fa'); }
        else { onClose(); }
      } else if (mode === 'login') {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        if (data.requires2FA) { setMode('2fa'); }
        else { localStorage.setItem('token', data.token); onClose(); window.location.reload(); }
      } else if (mode === '2fa') {
        const res = await fetch('/api/v1/auth/verify-2fa', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, token: twoFA }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || '2FA failed');
        localStorage.setItem('token', data.token);
        onClose();
        window.location.reload();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md glass rounded-2xl p-8 relative"
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white">✕</button>

        <h2 className="text-2xl font-bold text-white mb-1">
          {mode === 'signup' ? 'Create Account' : mode === 'login' ? 'Welcome Back' : 'Two-Factor Auth'}
        </h2>
        <p className="text-gray-400 text-sm mb-6">
          {mode === 'signup' ? 'Join in 60 seconds — start winning today' : mode === 'login' ? 'Sign in to your account' : 'Enter your 2FA code'}
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>
        )}

        {mode === '2fa' && qrCode && (
          <div className="mb-4 flex flex-col items-center gap-3">
            <p className="text-sm text-gray-400">Scan with your authenticator app:</p>
            <img src={qrCode} alt="2FA QR" className="w-48 h-48 rounded-lg" />
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === '2fa' ? (
            <input
              type="text"
              placeholder="Enter 6-digit code"
              value={twoFA}
              onChange={(e) => setTwoFA(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-casino-accent focus:outline-none transition-colors text-center text-2xl tracking-[0.5em]"
              maxLength={6}
            />
          ) : (
            <>
              {mode === 'signup' && (
                <input
                  type="text"
                  placeholder="Username"
                  value={form.username}
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-casino-accent focus:outline-none transition-colors"
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-casino-accent focus:outline-none transition-colors"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-casino-accent focus:outline-none transition-colors"
                required
              />
              {mode === 'signup' && (
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-casino-accent focus:outline-none transition-colors"
                  required
                />
              )}
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-gradient-to-r from-casino-accent to-yellow-500 text-black font-bold hover:shadow-lg hover:shadow-casino-accent/25 transition-all disabled:opacity-50"
          >
            {loading ? '...' : mode === 'signup' ? 'Create Account' : mode === 'login' ? 'Sign In' : 'Verify'}
          </button>
        </form>

        {mode !== '2fa' && (
          <p className="mt-4 text-center text-sm text-gray-400">
            {mode === 'signup' ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setError(''); }}
              className="text-casino-accent hover:underline"
            >
              {mode === 'signup' ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
