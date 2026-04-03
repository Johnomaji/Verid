const CARDS = [
  {
    metric: "0.4s",
    title: "Finality",
    desc: "Sub-second confirmation for time-sensitive commodity verification. Inspectors get on-chain proof before leaving the warehouse floor.",
  },
  {
    metric: "<$0.001",
    title: "Per Transaction",
    desc: "Fractions of a cent makes this viable at 10,000+ receipts per month. Impossible on Ethereum L1. Practical only on Solana.",
  },
  {
    metric: "DeFi",
    title: "Ecosystem",
    desc: "Direct integration with Credix, Pyth oracles, USDC on Solana, and the SuperteamNG builder network across West Africa.",
  },
  {
    metric: "SPL",
    title: "Token Standard",
    desc: "Receipts are standard SPL tokens — pluggable into any Solana DeFi protocol, lending pool, or structured product from day one.",
  },
];

export default function WhySolana() {
  return (
    <section className="py-[120px] relative">
      <div className="max-w-[1200px] mx-auto px-6">
        <p className="section-label">Why Solana</p>
        <h2 className="section-title">Built for the Speed of Trade</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          {CARDS.map((card) => (
            <div key={card.title} className="bg-navy-light border border-white/10 rounded-2xl p-6 hover:border-white/20 hover:-translate-y-1 transition-all duration-300">
              <div className="font-display font-bold text-[1.6rem] text-teal mb-1">{card.metric}</div>
              <div className="font-display font-bold text-cream text-[1rem] mb-3">{card.title}</div>
              <p className="text-[0.82rem] text-white/50 leading-[1.6]">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
