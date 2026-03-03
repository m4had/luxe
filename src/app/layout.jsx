import './globals.css';

export const metadata = {
  title: 'LuxeBet — Premium Online Casino',
  description: 'Experience the thrill of premium online gaming with slots, live dealer, crash games and more.',
  keywords: 'online casino, slots, live dealer, crash games, crypto casino',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-casino-dark antialiased">
        {children}
      </body>
    </html>
  );
}
