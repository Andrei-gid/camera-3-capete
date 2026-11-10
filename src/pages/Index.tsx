import ThreeHeadsShowcase from "@/components/ThreeHeads";
import FloatingGlassSidebar from "@/components/FloatingGlassSidebar";
import LandingHeroConfigurator from "@/components/LandingHeroConfigurator";
import HeroSubNav from "@/components/HeroSubNav";
import { SpecsCards, SafeSection } from "@/components/SpecsCards";
import DualViewCompare from "@/components/DualView";
import ZoomTestVideo from "@/components/ZoomTestVideo";
import InteractiveInfographicSection from "@/components/InteractiveInfographicSection";
import TrustFeaturesGrid from "@/components/TrustFeaturesGrid";
import TechnicalSpecsSection from "@/components/TechnicalSpecsSection";
import AirflowBasketSection from "@/components/AirflowBasketSection";

// PTZ module close-up block: not needed for the 3-head camera for now
const SHOW_PTZ_MODULE = false;
import LiquidFocusCarousel from "@/components/LiquidFocusCarousel";
import VideoSection from "@/components/VideoSection";
import DeliveryTrustSection from "@/components/DeliveryTrustSection";


import LuxuryFooter from "@/components/LuxuryFooter";
import BottomCheckoutWidget from "@/components/BottomCheckoutWidget";
import ProductAssistantChat from "@/components/ProductAssistantChat";
import FloatingMessengers from "@/components/FloatingMessengers";
import SetupSteps from "@/components/effects/SetupSteps";
import DayNightShowcase from "@/components/effects/DayNightShowcase";
import Rotate360Showcase from "@/components/effects/Rotate360Showcase";
import { ParallaxGlow, Reveal, StatsCounters } from "@/components/effects/MotionFx";
import { ProgressBeam, ScanReveal, TechGrid } from "@/components/effects/HighTech";

// "Descriere detaliată" infographic (photo with + hotspots and numbered list): hidden, kept in code.
const SHOW_INFOGRAPHIC = false;

const Index = () => {
  return (
    // overflow-x: clip (not overflow-hidden): hides sideways spill from slide-ins and glows
    // without creating a scroll container, so sticky scroll scenes keep working
    <div className="min-h-screen relative" style={{ overflowX: "clip" }}>
      {/* Neon scroll-progress line, perspective grid and drifting glow */}
      <ProgressBeam />
      <TechGrid />
      <ParallaxGlow />

      {/* Floating Glass Sidebar / Top Bar (responsive) */}
      <FloatingGlassSidebar />

      {/* Main Content - no left margin on mobile, has ml-24 on desktop for sidebar */}
      <main className="relative z-10 ml-0 md:ml-24 min-h-screen pt-0 md:py-16 px-0 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero — Interactive Glass Configurator */}
          <div className="animate-fade-in-up">
            <LandingHeroConfigurator />
          </div>

          {/* Zoom test video — first block right after the order form */}
          <SafeSection>
            <ZoomTestVideo />
          </SafeSection>

          {/* Sub-navigation pills */}
          <div className="animate-fade-in-up">
            <HeroSubNav />
          </div>

          {/* Technical Specifications */}
          <div id="specificatii" className="scroll-mt-20">
            <SafeSection>
              <SpecsCards />
            </SafeSection>
          </div>

          {/* 3 motorised heads vs ordinary camera (only its lower head turns), driven from the phone — CSS 3D */}
          <SafeSection>
            <ThreeHeadsShowcase />
          </SafeSection>

          {/* Liquid Focus Carousel — mobile only, immediately after specs */}
          <Reveal>
            <LiquidFocusCarousel />
          </Reveal>

          {/* Bluetooth pairing now lives inside the specs section (SpecsCards → BtCard) */}

          {/* Step-by-step connection with app screenshots */}
          <SetupSteps />

          {/* 10x zoom scene now lives inside the specs section (SpecsCards) */}


          {/* Interactive Infographic — Descriere Detaliată.
              Hidden for now (SHOW_INFOGRAPHIC = false), not deleted: set it to true to bring the block back.
              The #descriere anchor stays, so the "Descriere" menu button scrolls to the next block. */}
          <div id="descriere" className="scroll-mt-20">
            {SHOW_INFOGRAPHIC && (
              <Reveal>
                <InteractiveInfographicSection />
              </Reveal>
            )}
          </div>

          {/* Trust Features Grid - 4 Column */}
          <Reveal>
            <TrustFeaturesGrid />
          </Reveal>

          {/* Count-up numbers */}
          <StatsCounters />

          {/* Technical Specifications Infographic */}
          <ScanReveal>
            <TechnicalSpecsSection />
          </ScanReveal>

          {/* Same scene from day to night (IR) while scrolling */}
          <DayNightShowcase />

          {/* "Modulul PTZ cu zoom hibrid" close-up — hidden on this site (kept in code; set SHOW_PTZ_MODULE = true to show) */}
          {SHOW_PTZ_MODULE && (
            <ScanReveal>
              <AirflowBasketSection />
            </ScanReveal>
          )}

          {/* Scroll-driven 360° turntable */}
          <Rotate360Showcase />

          {/* Video Section */}
          <Reveal>
            <VideoSection />
          </Reveal>

          {/* Delivery Trust Image Section */}
          <ScanReveal>
            <DeliveryTrustSection />
          </ScanReveal>

          {/* Bottom Ultra-Premium Checkout Widget */}
          <div id="comanda" className="scroll-mt-20">
            <Reveal>
              <BottomCheckoutWidget />
            </Reveal>
          </div>

          <LuxuryFooter />
          <FloatingMessengers />
          <ProductAssistantChat />
        </div>
      </main>
    </div>
  );
};

export default Index;
