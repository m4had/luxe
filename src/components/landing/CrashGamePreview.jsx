'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function CrashGamePreview() {
  const [multiplier, setMultiplier] = useState(1.0);
  const [crashed, setCrashed] = useState(false);
  const [history] = useState([2.34, 1.12, 5.67, 1.89, 12.45, 3.21, 1.05, 8.76, 2.98, 1.44]);

  useEffect(() => {
    if (crashed) return;
    const interval = setInterval(() => {
      setMultiplier((m) => {
        const next = m + 0.01 * (1 + Math.random() * m * 0.1);
        if (Math.random() < 0.005 * m) { setCrashed(true); return m; }
        return parseFloat(next.toFixed(2));
      });
    }, 50);
    return () => clearInterval(interval);
  }, [crashed]);

  useEffect(() => {
    if (crashed) {
      const t = setTimeout(() => { setMultiplier(1.0); setCrashed(false); }, 3000);
      return () => clearTimeout(t);
    }
  }, [crashed]);

  return (
    <section id="crash" className="py-20 px-4 max-w-7xl mx-auto">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">🚀 Crash Games</h2>
      <p className="text-gray-400 mb-8">Cash out before the crash — provably fair</p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Game display */}
        <div className="glass rounded-2xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-400">Current Round</span>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${crashed ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
              {crashed ? 'CRASHED' : 'LIVE'}
            </span>
          </div>

          <div className="h-48 flex items-center justify-center">
            <motion.div
              key={crashed ? 'crashed' : 'live'}
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              className={`text-7xl font-black ${crashed ? 'text-red-500' : multiplier > 2 ? 'text-green-400' : 'text-white'}`}
            >
              {multiplier.toFixed(2)}x
            </motion.div>
          </div>

          <div className="flex gap-3 mt-4">
            <button className="flex-1 py-3 rounded-lg bg-green-500 text-white font-bold hover:bg-green-600 transition-colors">
              Bet $10
            </button>
            <button className="flex-1 py-3 rounded-lg bg-casino-accent text-black font-bold hover:bg-yellow-500 transition-colors">
              Cash Out
            </button>
          </div>
        </div>

        {/* History */}
        <div className="glass rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Recent Rounds</h3>
          <div className="grid grid-cols-5 gap-2">
            {history.map((h, i) => (
              <div
                key={i}
                className={`p-2 rounded-lg text-center text-sm font-bold ${
                  h >= 2 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}
              >
                {h}x
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <h4 className="text-sm font-semibold text-gray-400">Live Bets</h4>
            {[
              { user: 'Player_42', bet: '$50', mult: '2.34x', profit: '+$67' },
              { user: 'CryptoKing', bet: '$200', mult: '—', profit: 'Playing...' },
              { user: 'LuckyAce', bet: '$25', mult: '5.12x', profit: '+$103' },
            ].map((b, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/5 text-sm">
                <span className="text-gray-300">{b.user}</span>
                <span className="text-gray-400">{b.bet}</span>
                <span className="text-casino-accent">{b.mult}</span>
                <span className={b.profit.startsWith('+') ? 'text-green-400' : 'text-gray-500'}>{b.profit}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
