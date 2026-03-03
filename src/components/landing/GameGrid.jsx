'use client';
import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const CATEGORIES = ['All', 'Popular', 'Slots', 'Table Games', 'Jackpot', 'New'];

const GAMES = [
  { id: 1, name: 'Aztec Gold Rush', provider: 'PragmaticPlay', category: 'Slots', rtp: 96.5, volatility: 'High', image: '🏛️', hot: true, jackpot: '$234,567' },
  { id: 2, name: 'Book of Shadows', provider: 'NoLimit City', category: 'Slots', rtp: 96.01, volatility: 'Extreme', image: '📖', hot: true },
  { id: 3, name: 'Dragon Fortune', provider: 'Evolution', category: 'Slots', rtp: 97.2, volatility: 'Medium', image: '🐉', new: true },
  { id: 4, name: 'Mega Moolah X', provider: 'Microgaming', category: 'Jackpot', rtp: 94.0, volatility: 'High', image: '🦁', jackpot: '$1,234,567' },
  { id: 5, name: 'Lightning Roulette', provider: 'Evolution', category: 'Table Games', rtp: 97.3, volatility: 'Low', image: '🎡' },
  { id: 6, name: 'Blackjack VIP', provider: 'Evolution', category: 'Table Games', rtp: 99.5, volatility: 'Low', image: '🃏' },
  { id: 7, name: 'Sweet Bonanza', provider: 'PragmaticPlay', category: 'Slots', rtp: 96.48, volatility: 'High', image: '🍬', hot: true },
  { id: 8, name: 'Gates of Olympus', provider: 'PragmaticPlay', category: 'Slots', rtp: 96.5, volatility: 'High', image: '⚡', hot: true },
  { id: 9, name: 'Starlight Princess', provider: 'PragmaticPlay', category: 'Slots', rtp: 96.5, volatility: 'High', image: '👸', new: true },
  { id: 10, name: 'Wild West Gold', provider: 'PragmaticPlay', category: 'Slots', rtp: 96.51, volatility: 'High', image: '🤠' },
  { id: 11, name: 'Treasure Chest', provider: 'NetEnt', category: 'Jackpot', rtp: 95.1, volatility: 'Medium', image: '💎', jackpot: '$89,012' },
  { id: 12, name: 'Baccarat Pro', provider: 'Evolution', category: 'Table Games', rtp: 98.76, volatility: 'Low', image: '🎴' },
];

const volColor = { Low: 'text-green-400 bg-green-400/10', Medium: 'text-yellow-400 bg-yellow-400/10', High: 'text-orange-400 bg-orange-400/10', Extreme: 'text-red-400 bg-red-400/10' };

export default function GameGrid() {
  const [cat, setCat] = useState('All');
  const [search, setSearch] = useState('');
  const [visible, setVisible] = useState(8);
  const ref = useRef(null);

  const filtered = GAMES.filter(
    (g) => (cat === 'All' || cat === 'Popular' && g.hot || cat === 'New' && g.new || g.category === cat) &&
      g.name.toLowerCase().includes(search.toLowerCase())
  );

  // Lazy load on scroll
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible((v) => Math.min(v + 4, filtered.length)); },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [filtered.length]);

  return (
    <section id="slots" className="py-20 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">🎰 Game Library</h2>
          <p className="text-gray-400 mt-1">3,500+ titles from top providers</p>
        </div>
        <input
          type="text"
          placeholder="Search games..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setVisible(8); }}
          className="w-full md:w-64 px-4 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 focus:border-casino-accent focus:outline-none text-sm"
        />
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => { setCat(c); setVisible(8); }}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
              cat === c
                ? 'bg-casino-accent text-black font-semibold'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.slice(0, visible).map((game, i) => (
          <motion.div
            key={game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group glass rounded-xl overflow-hidden hover:border-casino-accent/30 transition-all cursor-pointer"
          >
            {/* Game image placeholder */}
            <div className="relative h-40 bg-gradient-to-br from-casino-card to-casino-darker flex items-center justify-center">
              <span className="text-6xl group-hover:scale-110 transition-transform">{game.image}</span>
              {game.hot && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-red-500/90 text-white text-xs font-semibold">🔥 HOT</span>}
              {game.new && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-casino-neon/90 text-black text-xs font-semibold">NEW</span>}
              {game.jackpot && (
                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-casino-accent/90 text-black text-xs font-bold">{game.jackpot}</span>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button className="px-6 py-2 rounded-lg bg-casino-accent text-black font-bold text-sm">Play Now</button>
              </div>
            </div>

            {/* Info */}
            <div className="p-3">
              <h3 className="font-semibold text-white text-sm truncate">{game.name}</h3>
              <p className="text-xs text-gray-500 mb-2">{game.provider}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full bg-casino-accent/10 text-casino-accent">RTP {game.rtp}%</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${volColor[game.volatility]}`}>{game.volatility}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Load more sentinel */}
      {visible < filtered.length && (
        <div ref={ref} className="flex justify-center mt-8">
          <button
            onClick={() => setVisible((v) => Math.min(v + 4, filtered.length))}
            className="px-6 py-3 rounded-lg glass text-gray-400 hover:text-white text-sm transition-colors"
          >
            Load More Games
          </button>
        </div>
      )}
    </section>
  );
}
