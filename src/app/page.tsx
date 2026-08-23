import { Navbar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Features } from "@/components/landing/features";
import { AppDemo } from "@/components/landing/app-demo";
import { CheckinDemo } from "@/components/landing/checkin-demo";
import { Trophies } from "@/components/landing/trophies";
import { FoSection } from "@/components/landing/fo-section";
import { Cta } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Features />
        <AppDemo />
        <CheckinDemo />
        <Trophies />
        <FoSection />
        <Cta />
      </main>
      <Footer />
    </>
  );
}
