'use client';

import Navbar from '@/components/layout/Navbar';
import HeroSection from '@/components/landing/HeroSection';
import GameGrid from '@/components/landing/GameGrid';
import LiveDealerSection from '@/components/landing/LiveDealerSection';
import CrashGamePreview from '@/components/landing/CrashGamePreview';
import SignUpPromo from '@/components/landing/SignUpPromo';
import PaymentMethods from '@/components/landing/PaymentMethods';
import ResponsibleGaming from '@/components/landing/ResponsibleGaming';
import Footer from '@/components/layout/Footer';

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <HeroSection />
      <GameGrid />
      <CrashGamePreview />
      <LiveDealerSection />
      <SignUpPromo />
      <PaymentMethods />
      <ResponsibleGaming />
      <Footer />
    </main>
  );
}
