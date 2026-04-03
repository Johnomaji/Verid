import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import Solution from "@/components/landing/Solution";
import HowItWorks from "@/components/landing/HowItWorks";
import WhySolana from "@/components/landing/WhySolana";
import Roadmap from "@/components/landing/Roadmap";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <WhySolana />
      <Roadmap />
      <CTA />
      <Footer />
    </>
  );
}
