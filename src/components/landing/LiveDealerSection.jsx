'use client';
import { motion } from 'framer-motion';

const tables = [
  { name: 'VIP Blackjack', dealer: 'Sofia', players: 5, minBet: '$25', image: '🃏', live: true },
  { name: 'Speed Roulette', dealer: 'Marcus', players: 18, minBet: '$1', image: '🎡', live: true },
  { name: 'Baccarat Squeeze', dealer: 'Mei Lin', players: 12, minBet: '$10', image: '🎴', live: true },
  { name: 'Casino Hold\'em', dealer: 'James', players: 7, minBet: '$5', image: '♠️', live: true },
  { name: 'Dragon Tiger', dealer: 'Priya', players: 22, minBet: '$1', image: '🐉', live: true },
  { name: 'Dream Catcher', dealer: 'Emma', players: 45, minBet: '$0.50', image: '🎡', live: true },
];

export default function LiveDealerSection() {
  return (
    <section id="live" className="py-20 px-4 max-w-7xl mx-auto">
      <div className="flex items-center gap-3 mb-2">
        <h2 className="text-3xl md:text-4xl font-bold text-white">🎥 Live Casino</h2>
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/20 text-red-400 text-sm">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> LIVE
        </span>
      </div>
      <p className="text-gray-400 mb-8">Real dealers, real cards, real-time — streamed in HD</p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map((t, i) => (
          <motion.div
            key={t.name}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="group glass rounded-xl overflow-hidden hover:border-casino-accent/30 transition-all cursor-pointer"
          >
            <div className="relative h-36 bg-gradient-to-br from-emerald-900/50 to-casino-darker flex items-center justify-center">
              <span className="text-5xl">{t.image}</span>
              <div className="absolute top-2 left-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-red-500/90 text-white text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-1 rounded-full bg-black/60 text-gray-300 text-xs">
                👥 {t.players} playing
              </div>
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button className="px-6 py-2 rounded-lg bg-green-500 text-white font-bold text-sm">Join Table</button>
              </div>
            </div>
            <div className="p-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-white text-sm">{t.name}</h3>
                <p className="text-xs text-gray-500">Dealer: {t.dealer}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-casino-accent/10 text-casino-accent">Min {t.minBet}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
