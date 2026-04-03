"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const MOCK_POOL = {
  totalDeposited: "$2,450,000",
  available: "$1,820,000",
  utilization: 25.7,
  activeLoans: 3,
  avgLtv: "68%",
  apy: "14.2%",
};

const MOCK_LOANS = [
  { id: "LOAN-001", receipt: "RCP-001", commodity: "Cocoa", borrower: "7xKX…3rPq", principal: "$42,875", ltv: "70%", rate: "13.5%", due: "2026-09-25", status: "ACTIVE" },
  { id: "LOAN-002", receipt: "RCP-003", commodity: "Sesame", borrower: "4mNQ…9sLr", principal: "$14,400", ltv: "65%", rate: "14.0%", due: "2026-07-10", status: "ACTIVE" },
  { id: "LOAN-003", receipt: "RCP-005", commodity: "Grain", borrower: "2kPZ…1tYm", principal: "$88,000", ltv: "72%", rate: "15.0%", due: "2026-06-01", status: "ACTIVE" },
];

const MOCK_COLLATERAL = [
  { id: "RCP-001", commodity: "Cocoa", qty: "24,500 kg", grade: "A", warehouse: "Lagos Cocoa Hub ★★★★★", faceValue: "$61,250", lastVerified: "2026-03-25", health: "good" },
  { id: "RCP-003", commodity: "Sesame", qty: "14,800 kg", grade: "B", warehouse: "Kano Sesame Depot ★★★★", faceValue: "$22,200", lastVerified: "2026-03-22", health: "good" },
  { id: "RCP-005", commodity: "Grain", qty: "200,000 kg", grade: "A", warehouse: "Abuja Grain Store ★★★★★", faceValue: "$122,000", lastVerified: "2026-03-18", health: "watch" },
];

const HEALTH_STYLE: Record<string, string> = {
  good: "text-teal bg-teal/10 border-teal/20",
  watch: "text-amber bg-amber/10 border-amber/20",
  risk: "text-red bg-red/10 border-red/20",
};

export default function LenderDashboard() {
  const { connected, publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<"pool" | "loans" | "collateral">("pool");

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#818CF8]/10 border border-[#818CF8]/20 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-[#818CF8]">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" fill="currentColor"/>
          </svg>
        </div>
        <div>
          <h2 className="font-display font-bold text-cream text-xl mb-2">Lender Portal</h2>
          <p className="text-white/50 text-sm mb-6">Connect your wallet to access institutional lending pools</p>
          <WalletMultiButton style={{ background: "#818CF8", color: "#0A1628", fontWeight: 700, borderRadius: "10px" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[0.7rem] text-[#818CF8] uppercase tracking-widest mb-1">Lender Portal</p>
          <h1 className="font-display font-bold text-cream text-2xl">Institutional Lending Pool</h1>
          <p className="text-white/50 text-sm mt-1 font-mono">{publicKey?.toBase58().slice(0, 8)}…{publicKey?.toBase58().slice(-6)}</p>
        </div>
        <button className="btn-primary" style={{ background: "#818CF8" }}>
          Deposit USDC
        </button>
      </div>

      {/* Pool stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Deposited", value: MOCK_POOL.totalDeposited },
          { label: "Available", value: MOCK_POOL.available },
          { label: "Utilization", value: `${MOCK_POOL.utilization}%` },
          { label: "Active Loans", value: String(MOCK_POOL.activeLoans) },
          { label: "Avg LTV", value: MOCK_POOL.avgLtv },
          { label: "Pool APY", value: MOCK_POOL.apy },
        ].map((s) => (
          <div key={s.label} className="card">
            <div className="font-display font-bold text-[#818CF8] text-[1.4rem] leading-tight">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-white/10">
        {(["pool", "loans", "collateral"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-all duration-200 bg-transparent capitalize ${
              activeTab === tab ? "text-[#818CF8] border-[#818CF8]" : "text-white/40 border-transparent hover:text-white/70"
            }`}
          >
            {tab === "pool" ? "Pool Overview" : tab === "loans" ? "Active Loans" : "Collateral"}
          </button>
        ))}
      </div>

      {/* Pool overview */}
      {activeTab === "pool" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="font-display font-bold text-cream mb-4">Pool Utilization</h3>
            <div className="mb-3 flex justify-between text-sm">
              <span className="text-white/50">Deployed</span>
              <span className="text-[#818CF8]">{MOCK_POOL.utilization}%</span>
            </div>
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-[#818CF8] rounded-full" style={{ width: `${MOCK_POOL.utilization}%` }} />
            </div>
            <div className="mt-5 space-y-2 text-sm">
              <div className="flex justify-between text-white/50">
                <span>Total Deposited</span><span className="text-cream">{MOCK_POOL.totalDeposited}</span>
              </div>
              <div className="flex justify-between text-white/50">
                <span>Outstanding Loans</span><span className="text-cream">$145,275</span>
              </div>
              <div className="flex justify-between text-white/50">
                <span>Available Liquidity</span><span className="text-cream">{MOCK_POOL.available}</span>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="font-display font-bold text-cream mb-4">Commodity Exposure</h3>
            {[
              { commodity: "Cocoa", share: 47, value: "$42,875" },
              { commodity: "Sesame", share: 16, value: "$14,400" },
              { commodity: "Grain", share: 37, value: "$88,000" },
            ].map((c) => (
              <div key={c.commodity} className="mb-3">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-white/60">{c.commodity}</span>
                  <span className="text-white/40 text-xs">{c.value} ({c.share}%)</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-amber rounded-full" style={{ width: `${c.share}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Loans */}
      {activeTab === "loans" && (
        <div className="space-y-3">
          {MOCK_LOANS.map((loan) => (
            <div key={loan.id} className="card flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[0.7rem] text-white/30">{loan.id}</span>
                  <span className="font-mono text-[0.6rem] text-teal bg-teal/10 border border-teal/20 px-2 py-0.5 rounded-full">{loan.status}</span>
                </div>
                <p className="text-cream text-sm font-medium">{loan.commodity} — {loan.receipt}</p>
                <p className="text-white/40 text-xs mt-0.5 font-mono">Borrower: {loan.borrower}</p>
              </div>
              <div className="flex gap-8 text-sm">
                <div>
                  <p className="text-white/30 text-xs mb-0.5">Principal</p>
                  <p className="text-cream font-medium">{loan.principal}</p>
                </div>
                <div>
                  <p className="text-white/30 text-xs mb-0.5">LTV</p>
                  <p className="text-amber font-medium">{loan.ltv}</p>
                </div>
                <div>
                  <p className="text-white/30 text-xs mb-0.5">Rate</p>
                  <p className="text-[#818CF8] font-medium">{loan.rate}</p>
                </div>
                <div>
                  <p className="text-white/30 text-xs mb-0.5">Due</p>
                  <p className="text-white/60 font-mono text-xs">{loan.due}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Collateral */}
      {activeTab === "collateral" && (
        <div className="space-y-3">
          {MOCK_COLLATERAL.map((col) => (
            <div key={col.id} className="card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex gap-4 items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-cream font-medium text-sm">{col.id}</span>
                      <span className={`font-mono text-[0.6rem] px-2 py-0.5 rounded-full border ${HEALTH_STYLE[col.health]}`}>
                        {col.health === "good" ? "HEALTHY" : col.health === "watch" ? "WATCH" : "AT RISK"}
                      </span>
                    </div>
                    <p className="text-white/50 text-xs">{col.warehouse}</p>
                  </div>
                </div>
                <div className="flex gap-8 text-sm">
                  <div>
                    <p className="text-white/30 text-xs mb-0.5">Commodity</p>
                    <p className="text-white/70">{col.commodity} — {col.qty}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs mb-0.5">Grade</p>
                    <p className="text-cream font-medium">{col.grade}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs mb-0.5">Face Value</p>
                    <p className="text-teal font-medium">{col.faceValue}</p>
                  </div>
                  <div>
                    <p className="text-white/30 text-xs mb-0.5">Last Verified</p>
                    <p className="text-white/50 font-mono text-xs">{col.lastVerified}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
