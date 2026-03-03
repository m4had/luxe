'use client';
import { motion } from 'framer-motion';

export default function SignUpPromo() {
  return (
    <section id="promo" className="py-20 px-4 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="relative rounded-3xl overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-casino-accent/20 via-casino-purple/20 to-casino-neon/20" />
        <div className="absolute inset-0 bg-casino-darker/80" />

        <div className="relative z-10 px-8 py-16 md:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-casino-accent mb-4">
            ⏱️ Sign Up in 60 Seconds
          </div>

          <h2 className="text-4xl md:text-6xl font-black text-white mb-4">
            Get <span className="text-gradient">200%</span> on Your First Deposit
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto mb-8">
            Up to $1,000 bonus + 100 free spins. No wagering on free spin winnings.
            Crypto deposits get an extra 50%.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-casino-accent to-yellow-500 text-black font-bold text-lg shadow-2xl shadow-casino-accent/25"
            >
              Claim Your Bonus
            </motion.button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {[
              { step: '1', title: 'Create Account', desc: 'Email + password. That\'s it.', icon: '📝' },
              { step: '2', title: 'Deposit Funds', desc: 'Crypto, cards, or e-wallets', icon: '💳' },
              { step: '3', title: 'Start Winning', desc: 'Instant access to 3,500+ games', icon: '🎰' },
            ].map((s) => (
              <div key={s.step} className="glass rounded-xl p-6 text-center">
                <div className="text-3xl mb-3">{s.icon}</div>
                <div className="text-xs text-casino-accent mb-1">Step {s.step}</div>
                <h3 className="font-semibold text-white mb-1">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>

          <p className="mt-8 text-xs text-gray-600">
            18+ | T&Cs apply | Gamble responsibly | BeGambleAware.org
          </p>
        </div>
      </motion.div>
    </section>
  );
}
