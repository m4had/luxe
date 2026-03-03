'use client';
import { motion } from 'framer-motion';

const methods = [
  { name: 'Visa', icon: '💳', type: 'card' },
  { name: 'Mastercard', icon: '💳', type: 'card' },
  { name: 'Bitcoin', icon: '₿', type: 'crypto' },
  { name: 'Ethereum', icon: 'Ξ', type: 'crypto' },
  { name: 'USDT', icon: '💲', type: 'crypto' },
  { name: 'Skrill', icon: '🅂', type: 'ewallet' },
  { name: 'Neteller', icon: '🅽', type: 'ewallet' },
  { name: 'Apple Pay', icon: '🍎', type: 'card' },
  { name: 'Bank Transfer', icon: '🏦', type: 'bank' },
  { name: 'Litecoin', icon: 'Ł', type: 'crypto' },
];

export default function PaymentMethods() {
  return (
    <section className="py-16 px-4 max-w-7xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-2">💳 Flexible Payments</h2>
        <p className="text-gray-400">Deposit & withdraw with your preferred method — crypto gets instant processing</p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {methods.map((m, i) => (
          <motion.div
            key={m.name}
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="glass rounded-xl px-5 py-3 flex items-center gap-2 hover:border-casino-accent/30 transition-all cursor-default"
          >
            <span className="text-xl">{m.icon}</span>
            <span className="text-sm text-gray-300">{m.name}</span>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {[
          { icon: '⚡', title: 'Instant Deposits', desc: 'Crypto deposits credited in under 1 minute' },
          { icon: '🔒', title: 'SSL Encrypted', desc: 'Bank-grade 256-bit encryption on all transactions' },
          { icon: '🌍', title: 'Multi-Currency', desc: 'USD, EUR, GBP + 10 cryptocurrencies supported' },
        ].map((f) => (
          <div key={f.title} className="text-center p-4">
            <div className="text-2xl mb-2">{f.icon}</div>
            <h3 className="font-semibold text-white text-sm">{f.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
