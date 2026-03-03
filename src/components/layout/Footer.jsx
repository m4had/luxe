'use client';

const links = {
  Games: ['Slots', 'Live Casino', 'Crash Games', 'Table Games', 'Jackpots'],
  Support: ['Help Center', 'Live Chat', 'Email Support', 'FAQ'],
  Legal: ['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'AML Policy', 'KYC Policy'],
  'Responsible Gaming': ['Deposit Limits', 'Self-Exclusion', 'Reality Check', 'GamCare', 'BeGambleAware'],
};

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-casino-darker">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-casino-accent to-casino-purple flex items-center justify-center font-black text-white text-sm">LB</div>
              <span className="text-lg font-bold text-gradient">LuxeBet</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Licensed and regulated. Provably fair gaming with instant crypto payouts.
            </p>
            <div className="flex gap-3">
              {['🐦', '💬', '📱', '📧'].map((e, i) => (
                <span key={i} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">{e}</span>
              ))}
            </div>
          </div>

          {Object.entries(links).map(([title, items]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-white mb-3">{title}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <a href="#" className="text-xs text-gray-500 hover:text-casino-accent transition-colors">{item}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © 2026 LuxeBet. All rights reserved. 18+ | Gamble Responsibly
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <span>🔒 SSL Secured</span>
            <span>🛡️ GDPR Compliant</span>
            <span>✅ Provably Fair</span>
            <span>🔞 18+</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
