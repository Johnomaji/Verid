import type { Metadata } from "next";
import "./globals.css";
import { DynamicProviders, DynamicNav } from "./client-layout";

export const metadata: Metadata = {
  title: "VeridLayer — Trust Infrastructure for Real-World Collateral",
  description:
    "Turn stranded commodity inventory into on-chain collateral. Physical verification → compliant receipts → institutional liquidity on Solana.",
  openGraph: {
    title: "VeridLayer",
    description: "Verify. Mint. Lend. Repeat.",
    siteName: "VeridLayer",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <DynamicProviders>
          <DynamicNav />
          <main>{children}</main>
        </DynamicProviders>
      </body>
    </html>
  );
}
