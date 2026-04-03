"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useState } from "react";

const NAV_LINKS = [
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Inspector", href: "/dashboard/inspector" },
  { label: "Warehouse", href: "/dashboard/warehouse" },
  { label: "Lend", href: "/dashboard/lender" },
  { label: "Docs", href: "/docs" },
];

export default function Nav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-[1000] py-4 bg-[#0A1628E6] backdrop-blur-xl border-b border-white/5 transition-all duration-300">
      <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8">
            <rect x="1" y="1" width="46" height="46" rx="12" stroke="#00E5A0" strokeWidth="2"/>
            <path d="M10 33L24 10L38 33" stroke="#00E5A0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="14" y1="25" x2="34" y2="25" stroke="#00E5A0" strokeWidth="1.5" opacity="0.3"/>
            <line x1="15.5" y1="29" x2="32.5" y2="29" stroke="#00E5A0" strokeWidth="1.5" opacity="0.3"/>
            <circle cx="24" cy="17" r="2" fill="#00E5A0"/>
          </svg>
          <span className="font-display font-bold text-[1.15rem] text-cream tracking-tighter">
            Verid<span className="text-teal">Layer</span>
          </span>
        </Link>

        {/* Desktop links */}
        <ul className="hidden md:flex items-center gap-8 list-none">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`text-[0.85rem] font-medium no-underline transition-colors duration-200 ${
                  pathname === link.href ? "text-cream" : "text-white/60 hover:text-cream"
                }`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Wallet button */}
        <div className="hidden md:block">
          <WalletMultiButton
            style={{
              background: "#00E5A0",
              color: "#0A1628",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: "0.85rem",
              borderRadius: "8px",
              padding: "8px 20px",
              height: "auto",
              lineHeight: "1.5",
            }}
          />
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden flex flex-col gap-[5px] bg-transparent border-none cursor-pointer p-1"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          <span className={`block w-6 h-[2px] bg-cream transition-all duration-300 ${mobileOpen ? "rotate-45 translate-y-[7px]" : ""}`} />
          <span className={`block w-6 h-[2px] bg-cream transition-all duration-300 ${mobileOpen ? "opacity-0" : ""}`} />
          <span className={`block w-6 h-[2px] bg-cream transition-all duration-300 ${mobileOpen ? "-rotate-45 -translate-y-[7px]" : ""}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-navy-light border-t border-white/5 px-6 py-4 flex flex-col gap-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[0.9rem] text-white/70 hover:text-cream no-underline"
              onClick={() => setMobileOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <WalletMultiButton
            style={{
              background: "#00E5A0",
              color: "#0A1628",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 700,
              fontSize: "0.85rem",
              borderRadius: "8px",
              width: "100%",
              justifyContent: "center",
            }}
          />
        </div>
      )}
    </nav>
  );
}
