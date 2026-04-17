import { ParticleCanvas } from "@/components/landing/ParticleCanvas";
import { HeroSection } from "@/components/landing/HeroSection";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#FAFAFA] overflow-hidden">
      <ParticleCanvas />
      <HeroSection />
    </main>
  );
}
