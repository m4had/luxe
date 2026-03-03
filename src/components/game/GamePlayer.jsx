'use client';
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Full-screen game player — loads games via aggregator iframe URL
 */
export default function GamePlayer({ gameId, gameName, onClose, mode = 'real' }) {
  const [gameUrl, setGameUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sessionWarning, setSessionWarning] = useState(null);
  const iframeRef = useRef(null);
  const checkInterval = useRef(null);

  useEffect(() => {
    launchGame();
    // Session check every 60s
    checkInterval.current = setInterval(checkSession, 60000);
    return () => clearInterval(checkInterval.current);
  }, []);

  async function launchGame() {
    try {
      const endpoint = mode === 'demo' ? '/api/v1/games/demo' : '/api/v1/games/launch';
      const headers = { 'Content-Type': 'application/json' };
      if (mode === 'real') headers.Authorization = `Bearer ${localStorage.getItem('token')}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ gameId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to launch');

      setGameUrl(data.gameUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function checkSession() {
    if (mode !== 'real') return;
    try {
      const res = await fetch('/api/v1/games/session-check', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      const data = await res.json();

      if (!data.ok) {
        setSessionWarning({ type: 'timeout', message: 'Your session has timed out. Please take a break.' });
        clearInterval(checkInterval.current);
      } else if (data.warning) {
        setSessionWarning({ type: 'warning', message: `⏱️ ${data.minutesRemaining} minutes remaining in your session` });
      } else if (data.realityCheck) {
        setSessionWarning({ type: 'reality', message: `You've been playing for ${data.minutesPlayed} minutes. Would you like to continue?` });
      }
    } catch {}
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex flex-col"
    >
      {/* Header bar */}
      <div className="h-12 bg-casino-darker flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <h3 className="text-white font-semibold text-sm truncate">{gameName}</h3>
          {mode === 'demo' && (
            <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs">DEMO</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => iframeRef.current?.requestFullscreen?.()}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Fullscreen"
          >
            ⛶
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Game content */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-casino-dark">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-casino-accent/30 border-t-casino-accent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading {gameName}...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-casino-dark">
            <div className="text-center max-w-md px-4">
              <div className="text-5xl mb-4">😕</div>
              <h3 className="text-xl font-bold text-white mb-2">Unable to Load Game</h3>
              <p className="text-gray-400 mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <button onClick={launchGame} className="px-6 py-2 rounded-lg bg-casino-accent text-black font-semibold">
                  Try Again
                </button>
                <button onClick={onClose} className="px-6 py-2 rounded-lg glass text-gray-300">
                  Go Back
                </button>
              </div>
            </div>
          </div>
        )}

        {gameUrl && (
          <iframe
            ref={iframeRef}
            src={gameUrl}
            className="w-full h-full border-0"
            allow="autoplay; fullscreen; encrypted-media"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            title={gameName}
            onLoad={() => setLoading(false)}
          />
        )}
      </div>

      {/* Session warnings */}
      <AnimatePresence>
        {sessionWarning && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={`absolute bottom-0 left-0 right-0 p-4 ${
              sessionWarning.type === 'timeout' ? 'bg-red-500/90' :
              sessionWarning.type === 'warning' ? 'bg-orange-500/90' : 'bg-blue-500/90'
            }`}
          >
            <div className="max-w-xl mx-auto flex items-center justify-between">
              <p className="text-white font-medium">{sessionWarning.message}</p>
              <div className="flex gap-2">
                {sessionWarning.type === 'timeout' ? (
                  <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white text-black font-semibold text-sm">
                    Close Game
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setSessionWarning(null)}
                      className="px-4 py-2 rounded-lg bg-white/20 text-white text-sm"
                    >
                      Continue
                    </button>
                    <button onClick={onClose} className="px-4 py-2 rounded-lg bg-white text-black font-semibold text-sm">
                      Take a Break
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
