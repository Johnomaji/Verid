import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#0A1628",
          light: "#0F1F38",
          mid: "#132847",
        },
        teal: {
          DEFAULT: "#00E5A0",
          dim: "#00E5A020",
          glow: "#00E5A040",
        },
        amber: {
          DEFAULT: "#F5A623",
          dim: "#F5A62320",
        },
        cream: "#FAFAFA",
        red: "#FF4D6A",
        indigo: "#818CF8",
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["Plus Jakarta Sans", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      letterSpacing: {
        tight: "-0.03em",
        tighter: "-0.02em",
        wide: "0.05em",
        wider: "0.1em",
        widest: "0.15em",
      },
      backgroundImage: {
        "grid-white":
          "linear-gradient(rgba(250,250,250,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(250,250,250,0.05) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "80px 80px",
      },
      animation: {
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "float-orb": "float-orb 20s ease-in-out infinite",
      },
      keyframes: {
        "pulse-dot": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
        "float-orb": {
          "0%, 100%": { transform: "translate(0, 0)" },
          "33%": { transform: "translate(30px, -20px)" },
          "66%": { transform: "translate(-20px, 15px)" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
