export default function Problem() {
  const problems = [
    {
      title: "No Trusted Verification",
      desc: "There is no standardised, tamper-proof way to verify that a physical commodity actually exists in a warehouse at the claimed quantity and quality.",
    },
    {
      title: "Double Pledging",
      desc: "The same receipt used as collateral for multiple loans simultaneously. No global, real-time lien registry exists.",
    },
    {
      title: "Fragmented Systems",
      desc: "National electronic receipt systems don't interoperate. Cross-border commodity collateral is impossible to construct.",
    },
  ];

  return (
    <section className="py-[120px] relative">
      <div className="max-w-[1200px] mx-auto px-6">
        <p className="section-label">The Problem</p>
        <h2 className="section-title max-w-[600px]">The $100B Financing Gap</h2>
        <p className="text-[1.05rem] text-white/60 max-w-[640px] leading-[1.7]">
          Warehouse receipts — the core financial primitive for commodity-backed lending — are
          fundamentally broken in emerging markets.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {problems.map((p) => (
            <div key={p.title} className="relative bg-navy-light border border-white/10 rounded-2xl p-8 group transition-all duration-300 hover:-translate-y-1 hover:border-white/20 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-red to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="w-12 h-12 rounded-xl bg-[#FF4D6A15] flex items-center justify-center mb-5">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-red">
                  <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="font-display font-bold text-[1.15rem] text-cream mb-2.5">{p.title}</h3>
              <p className="text-[0.9rem] text-white/60 leading-[1.65]">{p.desc}</p>
            </div>
          ))}
        </div>

        {/* Stat bar */}
        <div className="mt-14 p-8 bg-gradient-to-br from-navy-light to-navy-mid border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-center">
          <span className="font-display font-extrabold text-[2rem] text-amber">$100B+</span>
          <p className="text-[1rem] text-white/60 text-left max-w-[550px]">
            in sub-Saharan African agricultural commodity financing goes unfunded each year due to
            inadequate collateral infrastructure — not lack of underlying value.
          </p>
        </div>
      </div>
    </section>
  );
}
