"use client";

import { useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const MOCK_ATTESTATIONS = [
  { id: "ATT-001", warehouse: "Lagos Cocoa Hub", commodity: "Cocoa", qty: "24,500 kg", grade: "A", status: "VERIFIED", date: "2026-03-25" },
  { id: "ATT-002", warehouse: "Kano Sesame Depot", commodity: "Sesame", qty: "12,000 kg", grade: "B", status: "PENDING", date: "2026-03-27" },
  { id: "ATT-003", warehouse: "Abuja Grain Store", commodity: "Grain", qty: "80,000 kg", grade: "A", status: "DISPUTED", date: "2026-03-20" },
];

const STATUS_STYLE: Record<string, string> = {
  VERIFIED: "text-teal bg-teal/10 border-teal/20",
  PENDING: "text-amber bg-amber/10 border-amber/20",
  DISPUTED: "text-red bg-red/10 border-red/20",
};

export default function InspectorDashboard() {
  const { connected, publicKey } = useWallet();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    warehouse: "",
    commodity: "cocoa",
    quantityKg: "",
    grade: "A",
    gpsLat: "",
    gpsLng: "",
    notes: "",
  });

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-teal/10 border border-teal/20 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" className="text-teal">
            <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <h2 className="font-display font-bold text-cream text-xl mb-2">Inspector Portal</h2>
          <p className="text-white/50 text-sm mb-6">Connect your wallet to submit and manage attestations</p>
          <WalletMultiButton style={{ background: "#00E5A0", color: "#0A1628", fontWeight: 700, borderRadius: "10px" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="section-label">Inspector Portal</p>
          <h1 className="font-display font-bold text-cream text-2xl">Attestation Dashboard</h1>
          <p className="text-white/50 text-sm mt-1 font-mono">{publicKey?.toBase58().slice(0, 8)}…{publicKey?.toBase58().slice(-6)}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : "+ New Attestation"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Attestations", value: "3" },
          { label: "Verified", value: "1" },
          { label: "Staked (REP)", value: "500" },
          { label: "Slash Count", value: "0" },
        ].map((s) => (
          <div key={s.label} className="card">
            <div className="stat-value">{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* New Attestation Form */}
      {showForm && (
        <div className="bg-navy-light border border-teal/20 rounded-2xl p-8">
          <h3 className="font-display font-bold text-cream text-lg mb-6">Submit New Attestation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[0.75rem] text-white/50 font-mono uppercase tracking-wider mb-2">Warehouse Name</label>
              <input className="input-field" placeholder="e.g. Lagos Cocoa Hub" value={form.warehouse} onChange={e => setForm({...form, warehouse: e.target.value})} />
            </div>
            <div>
              <label className="block text-[0.75rem] text-white/50 font-mono uppercase tracking-wider mb-2">Commodity</label>
              <select className="input-field" value={form.commodity} onChange={e => setForm({...form, commodity: e.target.value})}>
                <option value="cocoa">Cocoa</option>
                <option value="sesame">Sesame</option>
                <option value="grain">Grain</option>
                <option value="coffee">Coffee</option>
              </select>
            </div>
            <div>
              <label className="block text-[0.75rem] text-white/50 font-mono uppercase tracking-wider mb-2">Quantity (kg)</label>
              <input className="input-field" type="number" placeholder="e.g. 24500" value={form.quantityKg} onChange={e => setForm({...form, quantityKg: e.target.value})} />
            </div>
            <div>
              <label className="block text-[0.75rem] text-white/50 font-mono uppercase tracking-wider mb-2">Quality Grade</label>
              <select className="input-field" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})}>
                <option value="A">Grade A</option>
                <option value="B">Grade B</option>
                <option value="C">Grade C</option>
              </select>
            </div>
            <div>
              <label className="block text-[0.75rem] text-white/50 font-mono uppercase tracking-wider mb-2">GPS Latitude</label>
              <input className="input-field" placeholder="e.g. 6.5244" value={form.gpsLat} onChange={e => setForm({...form, gpsLat: e.target.value})} />
            </div>
            <div>
              <label className="block text-[0.75rem] text-white/50 font-mono uppercase tracking-wider mb-2">GPS Longitude</label>
              <input className="input-field" placeholder="e.g. 3.3792" value={form.gpsLng} onChange={e => setForm({...form, gpsLng: e.target.value})} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-[0.75rem] text-white/50 font-mono uppercase tracking-wider mb-2">Upload Inspection Photos</label>
              <div className="border border-dashed border-white/20 rounded-xl p-8 text-center hover:border-teal/40 transition-colors cursor-pointer">
                <p className="text-white/40 text-sm">Drop photos here or click to upload</p>
                <p className="text-white/20 text-xs mt-1 font-mono">Will be stored on IPFS</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button className="btn-primary">Submit & Sign On-Chain</button>
            <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Attestation list */}
      <div>
        <h3 className="font-display font-bold text-cream text-lg mb-4">Recent Attestations</h3>
        <div className="space-y-3">
          {MOCK_ATTESTATIONS.map((att) => (
            <div key={att.id} className="card flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <span className="font-mono text-[0.7rem] text-white/30">{att.id}</span>
                <div>
                  <p className="text-cream text-sm font-medium">{att.warehouse}</p>
                  <p className="text-white/40 text-xs mt-0.5">{att.commodity} · {att.qty} · Grade {att.grade}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-mono text-[0.65rem] text-white/30">{att.date}</span>
                <span className={`font-mono text-[0.65rem] px-2.5 py-1 rounded-full border ${STATUS_STYLE[att.status]}`}>
                  {att.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
