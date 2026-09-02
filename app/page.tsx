import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { HeroSection } from '@/components/landing/HeroSection';
import { StatsSection } from '@/components/landing/StatsSection';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { FeaturesGrid } from '@/components/landing/FeaturesGrid';
import { IssueTypeTabs } from '@/components/landing/IssueTypeTabs';
import { PricingSection } from '@/components/landing/PricingSection';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <HeroSection />
        <StatsSection />
        <HowItWorks />
        <FeaturesGrid />
        <IssueTypeTabs />
        <PricingSection />
      </main>
      <Footer />
    </div>
  );
}
