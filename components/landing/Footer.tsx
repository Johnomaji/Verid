import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 48 48" fill="none" className="w-7 h-7">
            <rect x="1" y="1" width="46" height="46" rx="12" stroke="#00E5A0" strokeWidth="2"/>
            <path d="M10 33L24 10L38 33" stroke="#00E5A0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="14" y1="25" x2="34" y2="25" stroke="#00E5A0" strokeWidth="1.5" opacity="0.3"/>
            <line x1="15.5" y1="29" x2="32.5" y2="29" stroke="#00E5A0" strokeWidth="1.5" opacity="0.3"/>
            <circle cx="24" cy="17" r="2" fill="#00E5A0"/>
          </svg>
          <span className="font-display font-bold text-cream tracking-tighter">
            Verid<span className="text-teal">Layer</span>
          </span>
        </div>

        <p className="font-mono text-[0.65rem] text-white/30 text-center">
          Verify. Mint. Lend. Repeat. &nbsp;·&nbsp; Colosseum Frontier Hackathon 2026 &nbsp;·&nbsp; Built on Solana
        </p>

        <div className="flex gap-6">
          <Link href="/dashboard/inspector" className="text-[0.8rem] text-white/40 hover:text-white/70 no-underline transition-colors">Inspector</Link>
          <Link href="/dashboard/warehouse" className="text-[0.8rem] text-white/40 hover:text-white/70 no-underline transition-colors">Warehouse</Link>
          <Link href="/dashboard/lender" className="text-[0.8rem] text-white/40 hover:text-white/70 no-underline transition-colors">Lender</Link>
        </div>
      </div>
    </footer>
  );
}
