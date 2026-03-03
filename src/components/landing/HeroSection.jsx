'use client';
import { motion } from 'framer-motion';

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Animated bg */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-casino-darker via-casino-dark to-purple-950/20" />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-casino-accent/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-casino-purple/10 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-casino-neon/5 rounded-full blur-[150px]" />
      </div>

      {/* Floating chips */}
      {['🎰', '💎', '🃏', '🎲', '♠️', '🪙'].map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-4xl opacity-20"
          style={{ top: `${15 + i * 14}%`, left: `${5 + i * 17}%` }}
          animate={{ y: [0, -20, 0], rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut' }}
        >
          {emoji}
        </motion.div>
      ))}

      <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-casino-accent mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span>2,847 Players Online Now</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black leading-tight mb-6">
            <span className="text-white">Play.</span>{' '}
            <span className="text-gradient">Win.</span>{' '}
            <span className="neon-text text-casino-neon">Repeat.</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Premium slots, live dealers, and crash games — all in one place.
            Crypto-friendly. Provably fair. Instant withdrawals.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-casino-accent to-yellow-500 text-black font-bold text-lg shadow-2xl shadow-casino-accent/25 animate-pulse-glow"
            >
              🎰 Start Playing — 200% Bonus
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl glass text-white font-semibold text-lg hover:border-casino-accent/50 transition-colors"
            >
              Explore Games →
            </motion.button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          {[
            { value: '3,500+', label: 'Games', icon: '🎮' },
            { value: '$12M+', label: 'Won This Month', icon: '💰' },
            { value: '< 5min', label: 'Avg Withdrawal', icon: '⚡' },
            { value: '99.9%', label: 'Uptime', icon: '🛡️' },
          ].map((s) => (
            <div key={s.label} className="glass rounded-xl p-4 text-center">
              <div className="text-2xl mb-1">{s.icon}</div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <div className="w-6 h-10 rounded-full border-2 border-gray-600 flex items-start justify-center p-1">
          <div className="w-1.5 h-3 rounded-full bg-casino-accent" />
        </div>
      </motion.div>
    </section>
  );
}
