"use client";

import Link from "next/link";

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-[140px] pb-[100px] overflow-hidden">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full bg-teal opacity-15 blur-[120px] -top-[200px] -right-[100px] animate-[float-orb_20s_ease-in-out_infinite]" />
        <div className="absolute w-[400px] h-[400px] rounded-full bg-amber opacity-15 blur-[120px] -bottom-[100px] -left-[50px] animate-[float-orb_25s_ease-in-out_infinite_reverse]" />
        {/* Grid */}
        <div className="absolute inset-0 bg-grid-white bg-grid [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,black,transparent)]" />
      </div>

      <div className="container max-w-[1200px] mx-auto px-6 relative z-10">
        {/* Badges */}
        <div className="flex flex-wrap gap-2.5 mb-8">
          <span className="badge"><span className="w-1.5 h-1.5 rounded-full bg-teal animate-pulse-dot" /> Built on Solana</span>
          <span className="badge">Colosseum Frontier Hackathon</span>
          <span className="badge">RWA Track</span>
        </div>

        {/* Headline */}
        <h1 className="font-display font-extrabold text-cream mb-6 max-w-[780px]"
          style={{ fontSize: "clamp(2.4rem, 6vw, 4.2rem)", lineHeight: 1.08, letterSpacing: "-0.03em" }}>
          Turn Stranded Capital Into{" "}
          <span className="bg-gradient-to-br from-teal to-[#00B8D4] bg-clip-text text-transparent">
            On-Chain Collateral
          </span>
        </h1>

        <p className="text-[1.1rem] text-white/60 max-w-[600px] leading-[1.7] mb-10">
          VeridLayer is the verification and liquidity layer that lets institutions lend against
          physically verified warehouse receipts on Solana — starting with $100B+ in underfinanced
          African commodities.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 mb-14">
          <Link href="/dashboard/warehouse" className="btn-primary">
            Get Started
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <Link href="/#how-it-works" className="btn-secondary">
            How It Works
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-12 max-w-sm">
          <div>
            <div className="stat-value">$100B+</div>
            <div className="stat-label">Financing gap in African commodities</div>
          </div>
          <div>
            <div className="stat-value">3</div>
            <div className="stat-label">Infrastructure layers</div>
          </div>
          <div>
            <div className="stat-value">0.4s</div>
            <div className="stat-label">Solana finality</div>
          </div>
        </div>
      </div>
    </section>
  );
}
