import { Navbar } from "@/components/Navbar";
import { ParticleBackground } from "@/components/ParticleBackground";
import { Hero } from "@/components/Hero";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-transparent text-foreground overflow-hidden font-sans">
      <ParticleBackground />
      <Navbar />
      <Hero />
    </main>
  );
}
