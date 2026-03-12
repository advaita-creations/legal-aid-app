import { Navbar } from './Navbar';
import { HeroSection } from './HeroSection';
import { StatsSection } from './StatsSection';
import { FeaturesSection } from './FeaturesSection';
import { DemoSection } from './DemoSection';
import { TestimonialsSection } from './TestimonialsSection';
import { PricingSection } from './PricingSection';
import { CTASection } from './CTASection';
import { Footer } from './Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0A0E27]">
      <Navbar />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <DemoSection />
      <TestimonialsSection />
      <PricingSection />
      <CTASection />
      <Footer />
    </div>
  );
}
