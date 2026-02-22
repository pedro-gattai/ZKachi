import Navbar from "@/components/Navbar";
import HeroMessage from "@/components/HeroMessage";
import RouletteWheel from "@/components/RouletteWheel";
import AsanohaPattern from "@/components/AsanohaPattern";
import TrustSection from "@/components/TrustSection";
import SectionDivider from "@/components/SectionDivider";
import LiquiditySection from "@/components/LiquiditySection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <AsanohaPattern />

      {/* Ambient glows */}
      <div
        className="absolute top-1/4 left-[5%] w-[500px] h-[500px] rounded-full pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, hsla(42,60%,55%,0.07) 0%, transparent 70%)" }}
      />
      <div
        className="absolute top-1/4 right-[5%] w-[600px] h-[600px] rounded-full pointer-events-none z-0"
        style={{ background: "radial-gradient(circle, hsla(263,76%,66%,0.08) 0%, transparent 70%)" }}
      />

      <Navbar />

      <main className="relative z-10 min-h-screen flex items-center justify-center px-6 pt-20 pb-24">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          <div className="flex justify-center lg:justify-start order-1">
            <HeroMessage />
          </div>
          <div className="flex items-center justify-center order-2 relative">
            <div
              className="absolute w-[500px] h-[500px] rounded-full animate-glow-pulse pointer-events-none"
              style={{ background: "radial-gradient(circle, hsla(263,76%,66%,0.11) 0%, transparent 70%)" }}
            />
            <div
              className="absolute bottom-[-30px] w-[300px] h-[40px] rounded-[50%] pointer-events-none"
              style={{ background: "radial-gradient(ellipse, hsla(263,76%,66%,0.15) 0%, transparent 70%)" }}
            />
            <div className="scale-[0.85] lg:scale-100 origin-center">
              <RouletteWheel />
            </div>
          </div>
        </div>
      </main>

      <SectionDivider />
      <TrustSection />
      <SectionDivider />
      <LiquiditySection />
      <Footer />
    </div>
  );
};

export default Index;
