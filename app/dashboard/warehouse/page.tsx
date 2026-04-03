"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const MOCK_RECEIPTS = [
  { id: "RCP-001", mint: "7xKX...3rPq", commodity: "Cocoa", qty: "24,500 kg", valueUsd: "$61,250", encumbered: "70%", expires: "2026-09-25", status: "ACTIVE" },
  { id: "RCP-002", mint: "9mZL...8fNw", commodity: "Sesame", qty: "12,000 kg", valueUsd: "$18,000", encumbered: "0%", expires: "2026-08-10", status: "AVAILABLE" },
];

const STATUS_STYLE: Record<string, string> = {
  ACTIVE: "text-amber bg-amber/10 border-amber/20",
  AVAILABLE: "text-teal bg-teal/10 border-teal/20",
  EXPIRED: "text-red bg-red/10 border-red/20",
};

export default function WarehouseDashboard() {
  const { connected, publicKey } = useWallet();
  const [activeTab, setActiveTab] = useState<"receipts" | "liens">("receipts");

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber/10 border border-amber/20 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-amber">
            <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h2 className="font-display font-bold text-cream text-xl mb-2">Warehouse Portal</h2>
          <p className="text-white/50 text-sm mb-6">Connect your wallet to manage receipts and collateral</p>
          <WalletMultiButton style={{ background: "#F5A623", color: "#0A1628", fontWeight: 700, borderRadius: "10px" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-[0.7rem] text-amber uppercase tracking-widest mb-1">Warehouse Portal</p>
          <h1 className="font-display font-bold text-cream text-2xl">Receipt Management</h1>
          <p className="text-white/50 text-sm mt-1 font-mono">{publicKey?.toBase58().slice(0, 8)}…{publicKey?.toBase58().slice(-6)}</p>
        </div>
        <button className="btn-primary" style={{ background: "#F5A623" }}>
          + Request Inspection
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Active Receipts", value: "2" },
          { label: "Total Value", value: "$79,250" },
          { label: "Collateral Used", value: "$42,875" },
          { label: "Available to Borrow", value: "$13,413" },
        ].map((s) => (
          <div key={s.label} className="card">
            <div className="font-display font-bold text-amber text-[1.8rem] leading-tight">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-white/10">
        {(["receipts", "liens"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-all duration-200 bg-transparent capitalize ${
              activeTab === tab ? "text-amber border-amber" : "text-white/40 border-transparent hover:text-white/70"
            }`}
          >
            {tab === "receipts" ? "Receipt Tokens" : "Lien Registry"}
          </button>
        ))}
      </div>

      {activeTab === "receipts" && (
        <div className="space-y-3">
          {MOCK_RECEIPTS.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber/10 border border-amber/20 flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-amber">
                      <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-cream font-medium text-sm">{r.id}</span>
                      <span className={`font-mono text-[0.6rem] px-2 py-0.5 rounded-full border ${STATUS_STYLE[r.status]}`}>{r.status}</span>
                    </div>
                    <p className="font-mono text-[0.7rem] text-white/30 mb-2">{r.mint}</p>
                    <div className="flex flex-wrap gap-4 text-xs text-white/50">
                      <span>{r.commodity}</span>
                      <span>{r.qty}</span>
                      <span className="text-cream font-medium">{r.valueUsd}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[0.75rem] text-white/40 mb-1">Encumbered</p>
                  <p className="font-display font-bold text-amber">{r.encumbered}</p>
                  <p className="text-[0.7rem] text-white/30 mt-1 font-mono">Expires {r.expires}</p>
                </div>
              </div>

              {/* LTV bar */}
              <div className="mt-4">
                <div className="flex justify-between text-[0.7rem] text-white/30 mb-1.5">
                  <span>Collateral Utilization</span>
                  <span>{r.encumbered}</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber rounded-full transition-all duration-500"
                    style={{ width: r.encumbered }}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                <button className="text-[0.8rem] font-medium text-amber hover:text-amber/80 transition-colors">Pledge as Collateral →</button>
                <button className="text-[0.8rem] font-medium text-white/30 hover:text-white/60 transition-colors">View On-chain</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "liens" && (
        <div className="card">
          <p className="text-white/50 text-sm">
            Lien registry shows all active encumbrances against your receipts.
          </p>
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-white/5 text-sm">
              <span className="text-white/60">RCP-001 — Cocoa 24,500 kg</span>
              <div className="flex items-center gap-4">
                <span className="text-amber font-medium">$42,875 pledged</span>
                <span className="font-mono text-[0.65rem] text-teal bg-teal/10 border border-teal/20 px-2 py-0.5 rounded-full">ACTIVE LIEN</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3 text-sm">
              <span className="text-white/60">RCP-002 — Sesame 12,000 kg</span>
              <span className="font-mono text-[0.65rem] text-white/30">No active liens</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
