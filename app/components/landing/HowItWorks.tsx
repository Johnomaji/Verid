const STEPS = [
  { num: "01", title: "On-site Inspection", desc: "Third-party inspector verifies warehouse inventory on-site" },
  { num: "02", title: "On-chain Attestation", desc: "Signed attestation anchored on-chain via Solana program" },
  { num: "03", title: "Receipt Minted", desc: "Receipt issued as SPL token with embedded metadata" },
  { num: "04", title: "Liquidity Unlocked", desc: "Institutional lender provides USDC against verified collateral" },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-[120px] relative">
      <div className="max-w-[900px] mx-auto px-6">
        <p className="section-label text-center">How It Works</p>
        <h2 className="section-title text-center mx-auto">From Floor to Liquidity in 4 Steps</h2>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Connector line */}
          <div className="hidden md:block absolute top-9 left-[12.5%] right-[12.5%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          {STEPS.map((step, i) => (
            <div key={step.num} className="flex flex-col items-center text-center gap-4">
              <div className="relative w-16 h-16 rounded-full border border-teal/30 bg-teal/5 flex items-center justify-center z-10">
                <span className="font-mono text-[0.7rem] text-teal tracking-wider">{step.num}</span>
              </div>
              <div>
                <h4 className="font-display font-bold text-cream text-[0.95rem] mb-1.5">{step.title}</h4>
                <p className="text-[0.82rem] text-white/50 leading-[1.6]">{step.desc}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div className="md:hidden w-[1px] h-8 bg-white/10" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
