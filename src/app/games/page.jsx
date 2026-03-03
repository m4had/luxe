'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import GamePlayer from '@/components/game/GamePlayer';

const CATEGORIES = ['all', 'slots', 'live_dealer', 'table', 'crash'];
const CAT_LABELS = { all: '🎮 All Games', slots: '🎰 Slots', live_dealer: '🎥 Live Dealer', table: '🃏 Table Games', crash: '🚀 Crash' };

export default function GamesPage() {
  const [games, setGames] = useState([]);
  const [providers, setProviders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('all');
  const [provider, setProvider] = useState('');
  const [search, setSearch] = useState('');
  const [offset, setOffset] = useState(0);
  const [activeGame, setActiveGame] = useState(null);
  const sentinel = useRef(null);
  const LIMIT = 30;

  const fetchGames = useCallback(async (reset = false) => {
    const newOffset = reset ? 0 : offset;
    const params = new URLSearchParams({ limit: LIMIT, offset: newOffset });
    if (category !== 'all') params.set('category', category);
    if (provider) params.set('provider', provider);
    if (search) params.set('search', search);

    try {
      const res = await fetch(`/api/v1/games/catalog?${params}`);
      const data = await res.json();
      setGames(reset ? data.games : [...games, ...data.games]);
      setTotal(data.total);
      setProviders(data.providers || []);
      setOffset(newOffset + LIMIT);
    } catch (err) {
      console.error('Fetch games error:', err);
    } finally {
      setLoading(false);
    }
  }, [category, provider, search, offset, games]);

  useEffect(() => {
    setLoading(true);
    setOffset(0);
    fetchGames(true);
  }, [category, provider, search]);

  // Infinite scroll
  useEffect(() => {
    if (!sentinel.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && games.length < total) fetchGames();
    }, { threshold: 0.1 });
    obs.observe(sentinel.current);
    return () => obs.disconnect();
  }, [games.length, total]);

  const launchGame = (game, mode = 'real') => {
    setActiveGame({ id: game.external_id, name: game.name, mode });
  };

  const volColor = { Low: 'text-green-400 bg-green-400/10', Medium: 'text-yellow-400 bg-yellow-400/10', High: 'text-orange-400 bg-orange-400/10', Extreme: 'text-red-400 bg-red-400/10' };

  return (
    <>
      <Navbar />
      <main className="pt-20 pb-12 px-4 max-w-7xl mx-auto min-h-screen">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Game Library</h1>
        <p className="text-gray-400 mb-6">{total.toLocaleString()} games from top providers</p>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                  category === c ? 'bg-casino-accent text-black font-semibold' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {CAT_LABELS[c]}
              </button>
            ))}
          </div>

          <div className="flex gap-2 ml-auto">
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-gray-300 text-sm"
            >
              <option value="">All Providers</option>
              {providers.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>

            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-gray-500 text-sm focus:border-casino-accent focus:outline-none"
            />
          </div>
        </div>

        {/* Grid */}
        {loading && games.length === 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="glass rounded-xl overflow-hidden animate-pulse">
                <div className="h-40 bg-white/5" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-3 bg-white/5 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {games.map((game, i) => (
              <motion.div
                key={game.external_id + '-' + i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (i % LIMIT) * 0.02 }}
                className="group glass rounded-xl overflow-hidden hover:border-casino-accent/30 transition-all cursor-pointer"
              >
                <div className="relative h-40 bg-gradient-to-br from-casino-card to-casino-darker flex items-center justify-center overflow-hidden">
                  {game.thumbnail ? (
                    <img src={game.thumbnail} alt={game.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                  ) : (
                    <span className="text-5xl">🎰</span>
                  )}

                  {game.is_new ? <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-casino-neon/90 text-black text-xs font-semibold">NEW</span> : null}
                  {game.is_popular ? <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-red-500/90 text-white text-xs font-semibold">🔥 HOT</span> : null}
                  {game.type === 'live_dealer' && <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/90 text-white text-xs"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />LIVE</span>}

                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                    <button onClick={() => launchGame(game, 'real')} className="px-5 py-2 rounded-lg bg-casino-accent text-black font-bold text-sm">
                      Play Now
                    </button>
                    {game.has_demo ? (
                      <button onClick={() => launchGame(game, 'demo')} className="px-5 py-1.5 rounded-lg bg-white/20 text-white text-xs">
                        Demo
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="p-3">
                  <h3 className="font-semibold text-white text-sm truncate">{game.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{game.provider}</p>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {game.rtp && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-casino-accent/10 text-casino-accent">RTP {game.rtp}%</span>}
                    {game.volatility && <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${volColor[game.volatility] || 'text-gray-400 bg-gray-400/10'}`}>{game.volatility}</span>}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Load more sentinel */}
        {games.length < total && <div ref={sentinel} className="h-20" />}
        {games.length > 0 && games.length >= total && (
          <p className="text-center text-gray-600 text-sm mt-8">All {total} games loaded</p>
        )}
      </main>

      {/* Game Player Overlay */}
      <AnimatePresence>
        {activeGame && (
          <GamePlayer
            gameId={activeGame.id}
            gameName={activeGame.name}
            mode={activeGame.mode}
            onClose={() => setActiveGame(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
