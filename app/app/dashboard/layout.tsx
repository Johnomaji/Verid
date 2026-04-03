"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Inspector", href: "/dashboard/inspector", color: "text-teal" },
  { label: "Warehouse", href: "/dashboard/warehouse", color: "text-amber" },
  { label: "Lender", href: "/dashboard/lender", color: "text-[#818CF8]" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen pt-[80px]">
      {/* Role switcher */}
      <div className="border-b border-white/5 bg-navy-light/50 backdrop-blur">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex gap-0">
            {TABS.map((tab) => {
              const active = pathname === tab.href;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`px-5 py-4 text-[0.85rem] font-medium no-underline border-b-2 transition-all duration-200 ${
                    active
                      ? `${tab.color} border-current`
                      : "text-white/40 border-transparent hover:text-white/70"
                  }`}
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-10">
        {children}
      </div>
    </div>
  );
}
