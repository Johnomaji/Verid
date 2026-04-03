"use client";

import dynamic from "next/dynamic";

// Wallet adapter touches window/document — must never run on the server
export const DynamicProviders = dynamic(
  () => import("./providers").then((m) => m.Providers),
  { ssr: false }
);

export const DynamicNav = dynamic(
  () => import("@/components/Nav"),
  { ssr: false }
);
