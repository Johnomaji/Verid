const LAYERS = [
  {
    num: "Layer 01",
    name: "Physical Oracle Network",
    desc: "Credentialed third-party inspectors perform GPS-tagged, photo-verified, cryptographically signed attestations of warehouse inventory — anchored on-chain. Recurring re-verification with staking mechanics: inspectors stake reputation tokens, slashing on disputed inspections.",
    tags: ["GPS Attestation", "Staking / Slashing", "IoT Sensors", "Recurring Audits"],
    accent: "#00E5A0",
  },
  {
    num: "Layer 02",
    name: "Receipt Token Protocol",
    desc: "Warehouse receipts minted as SPL tokens on Solana with embedded oracle metadata. On-chain lien registry records encumbrances, supports partial pledging, enforces priority of claims. Legal enforceability via jurisdiction-specific opinion wrappers aligned with UNCITRAL frameworks.",
    tags: ["SPL Tokens", "Lien Registry", "UNCITRAL", "Partial Pledging"],
    accent: "#F5A623",
  },
  {
    num: "Layer 03",
    name: "Institutional Lending",
    desc: "Verified receipts flow into institutional lending pools — trade finance funds and DFIs provide USDC credit lines against pooled collateral. Dynamic LTV based on commodity type, warehouse rating, and inspection recency. Direct integration with Solana DeFi credit protocols.",
    tags: ["USDC Lending", "Dynamic LTV", "Credix Integration", "KYC / KYB"],
    accent: "#818CF8",
  },
];

export default function Solution() {
  return (
    <section className="py-[120px] relative">
      <div className="max-w-[1200px] mx-auto px-6">
        <p className="section-label">The Solution</p>
        <h2 className="section-title">Three Layers, One Protocol</h2>
        <p className="text-[1.05rem] text-white/60 max-w-[640px] leading-[1.7]">
          Three infrastructure layers that transform physical commodity inventory into programmable,
          institution-grade on-chain collateral.
        </p>

        <div className="mt-14 flex flex-col gap-[2px]">
          {LAYERS.map((layer, i) => (
            <div
              key={layer.num}
              className={`bg-navy-light border border-white/10 p-9 px-10 grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8 items-start transition-all duration-300 hover:bg-navy-mid hover:border-white/20 group relative overflow-hidden cursor-default
                ${i === 0 ? "rounded-t-2xl" : ""}
                ${i === LAYERS.length - 1 ? "rounded-b-2xl" : ""}
              `}
            >
              {/* Left accent bar on hover */}
              <div
                className="absolute left-0 top-0 bottom-0 w-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: layer.accent }}
              />

              {/* Layer label */}
              <div className="flex flex-col gap-2">
                <span className="font-mono text-[0.7rem] text-white/40 uppercase tracking-wider">
                  {layer.num}
                </span>
                <h3 className="font-display font-bold text-[1.15rem] text-cream leading-[1.3]">
                  {layer.name}
                </h3>
              </div>

              {/* Content */}
              <div>
                <p className="text-[0.92rem] text-white/60 leading-[1.7] mb-3">{layer.desc}</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {layer.tags.map((tag) => (
                    <span key={tag} className="layer-tag">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
