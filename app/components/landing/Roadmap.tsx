const PHASES = [
  {
    phase: "Phase 1",
    label: "Hackathon MVP",
    status: "current",
    items: [
      "Smart contract suite on Solana devnet",
      "Inspector attestation web flow",
      "Mock oracle attestation flow",
      "Receipt minting (SPL token)",
      "Basic lien registry",
    ],
  },
  {
    phase: "Phase 2",
    label: "Pilot",
    status: "next",
    items: [
      "5–10 certified warehouses",
      "1 commodity (cocoa or sesame)",
      "First institutional lending partner onboarded",
      "KYC/KYB integration",
    ],
  },
  {
    phase: "Phase 3",
    label: "Scale",
    status: "future",
    items: [
      "Multi-commodity support",
      "Integration with 2+ Solana lending protocols",
      "Cross-border receipt portability",
      "IoT sensor integration",
    ],
  },
];

const statusStyles: Record<string, string> = {
  current: "border-teal/40 bg-teal/5",
  next: "border-white/10 bg-navy-light",
  future: "border-white/10 bg-navy-light opacity-60",
};

const dotStyles: Record<string, string> = {
  current: "bg-teal",
  next: "bg-white/30",
  future: "bg-white/10",
};

export default function Roadmap() {
  return (
    <section className="py-[120px] relative">
      <div className="max-w-[1200px] mx-auto px-6">
        <p className="section-label">Roadmap</p>
        <h2 className="section-title">Building in Public</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {PHASES.map((phase) => (
            <div key={phase.phase} className={`rounded-2xl border p-8 ${statusStyles[phase.status]}`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-2 h-2 rounded-full ${dotStyles[phase.status]}`} />
                <span className="font-mono text-[0.65rem] text-white/40 uppercase tracking-wider">{phase.phase}</span>
              </div>
              <h3 className="font-display font-bold text-cream text-[1.1rem] mb-5">{phase.label}</h3>
              <ul className="flex flex-col gap-2.5">
                {phase.items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[0.85rem] text-white/60">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="mt-[2px] flex-shrink-0 text-teal/50">
                      <path d="M2.5 7l3 3 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
