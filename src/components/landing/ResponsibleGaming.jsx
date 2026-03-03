'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function ResponsibleGaming() {
  const [depositLimit, setDepositLimit] = useState('');
  const [sessionTimeout, setSessionTimeout] = useState('60');
  const [selfExclude, setSelfExclude] = useState(false);

  return (
    <section className="py-16 px-4 max-w-7xl mx-auto">
      <div className="glass rounded-2xl p-8 md:p-12">
        <div className="flex items-center gap-3 mb-2">
          <h2 className="text-2xl md:text-3xl font-bold text-white">🛡️ Responsible Gaming</h2>
        </div>
        <p className="text-gray-400 mb-8">
          Your safety comes first. We provide tools to help you stay in control.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Deposit Limits */}
          <div className="bg-white/5 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
              💰 Deposit Limits
            </h3>
            <p className="text-xs text-gray-500 mb-4">Set daily, weekly, or monthly limits</p>
            <select
              className="w-full px-3 py-2 rounded-lg bg-casino-dark border border-white/10 text-white text-sm mb-2"
              defaultValue="daily"
            >
              <option value="daily">Daily Limit</option>
              <option value="weekly">Weekly Limit</option>
              <option value="monthly">Monthly Limit</option>
            </select>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Amount ($)"
                value={depositLimit}
                onChange={(e) => setDepositLimit(e.target.value)}
                className="flex-1 px-3 py-2 rounded-lg bg-casino-dark border border-white/10 text-white text-sm placeholder:text-gray-600"
              />
              <button className="px-4 py-2 rounded-lg bg-casino-accent text-black text-sm font-semibold">
                Set
              </button>
            </div>
          </div>

          {/* Session Timeout */}
          <div className="bg-white/5 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
              ⏱️ Session Time-Out
            </h3>
            <p className="text-xs text-gray-500 mb-4">Get reminded when session exceeds limit</p>
            <div className="space-y-2">
              {['30', '60', '120', '240'].map((t) => (
                <button
                  key={t}
                  onClick={() => setSessionTimeout(t)}
                  className={`w-full px-3 py-2 rounded-lg text-sm text-left transition-all ${
                    sessionTimeout === t
                      ? 'bg-casino-accent/20 text-casino-accent border border-casino-accent/30'
                      : 'bg-casino-dark border border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  {t} minutes
                </button>
              ))}
            </div>
          </div>

          {/* Self-Exclusion */}
          <div className="bg-white/5 rounded-xl p-5">
            <h3 className="font-semibold text-white mb-1 flex items-center gap-2">
              🚫 Self-Exclusion
            </h3>
            <p className="text-xs text-gray-500 mb-4">Temporarily or permanently block your account</p>
            <div className="space-y-3">
              {['24 hours', '7 days', '30 days', '6 months', 'Permanent'].map((period) => (
                <button
                  key={period}
                  className="w-full px-3 py-2 rounded-lg bg-casino-dark border border-white/10 text-gray-400 hover:text-red-400 hover:border-red-500/30 text-sm text-left transition-all"
                >
                  Exclude for {period}
                </button>
              ))}
            </div>

            <div className="mt-4 p-3 rounded-lg bg-red-500/5 border border-red-500/20">
              <p className="text-xs text-red-400">
                ⚠️ Self-exclusion cannot be reversed once activated. Contact support for assistance.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap gap-4 text-xs text-gray-500">
          <a href="https://www.begambleaware.org" className="hover:text-casino-accent transition-colors">BeGambleAware.org</a>
          <a href="https://www.gamcare.org.uk" className="hover:text-casino-accent transition-colors">GamCare</a>
          <a href="https://www.gamblingtherapy.org" className="hover:text-casino-accent transition-colors">Gambling Therapy</a>
          <span>18+ Only | Play Responsibly</span>
        </div>
      </div>
    </section>
  );
}
