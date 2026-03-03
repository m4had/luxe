'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/admin/dashboard', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="min-h-screen bg-casino-dark flex items-center justify-center text-white">Loading...</div>;
  if (!data?.stats) return <div className="min-h-screen bg-casino-dark flex items-center justify-center text-red-400">Access denied or server offline</div>;

  const { stats, recentTransactions, fraudAlerts } = data;

  const statCards = [
    { label: 'Total Users', value: stats.totalUsers.toLocaleString(), icon: '👥', color: 'from-blue-500 to-cyan-500' },
    { label: 'Active Today', value: stats.activeToday.toLocaleString(), icon: '🟢', color: 'from-green-500 to-emerald-500' },
    { label: 'Total Deposits', value: `$${stats.totalDeposits.toLocaleString()}`, icon: '💰', color: 'from-casino-accent to-yellow-500' },
    { label: 'Revenue', value: `$${stats.revenue.toLocaleString()}`, icon: '📈', color: 'from-purple-500 to-pink-500' },
    { label: 'Pending Withdrawals', value: stats.pendingWithdrawals, icon: '⏳', color: 'from-orange-500 to-red-500' },
    { label: 'Fraud Alerts', value: stats.fraudAlerts, icon: '🚨', color: stats.fraudAlerts > 0 ? 'from-red-500 to-red-700' : 'from-gray-500 to-gray-700' },
    { label: 'Self-Excluded', value: stats.selfExcluded, icon: '🚫', color: 'from-gray-500 to-gray-700' },
  ];

  return (
    <div className="min-h-screen bg-casino-dark p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">🎰 Admin Dashboard</h1>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass rounded-xl p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{s.icon}</span>
                <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${s.color}`} />
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-gray-500">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Transactions */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Transactions</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentTransactions?.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 text-sm">
                  <div>
                    <span className="text-gray-300">{tx.username}</span>
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${tx.type === 'deposit' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {tx.type}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-medium">${tx.amount}</div>
                    <div className="text-xs text-gray-500">{tx.status}</div>
                  </div>
                </div>
              ))}
              {(!recentTransactions || recentTransactions.length === 0) && (
                <p className="text-gray-500 text-sm text-center py-4">No transactions yet</p>
              )}
            </div>
          </div>

          {/* Fraud Alerts */}
          <div className="glass rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">🚨 Fraud Alerts</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {fraudAlerts?.map((f) => (
                <div key={f.id} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      f.severity === 'high' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {f.severity}
                    </span>
                    <span className="text-xs text-gray-500">{new Date(f.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-300">{f.event_type.replace(/_/g, ' ')}</p>
                  <p className="text-xs text-gray-500 mt-1">{f.details}</p>
                </div>
              ))}
              {(!fraudAlerts || fraudAlerts.length === 0) && (
                <p className="text-green-400 text-sm text-center py-4">✅ No active alerts</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
