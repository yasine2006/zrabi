import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx,mdx}",
    "./src/components/**/*.{ts,tsx,mdx}",
    "./src/lib/**/*.{ts,tsx}",
    "./messages/**/*.json",
  ],
  theme: {
    extend: {
      colors: {
        // Core Zarbia Atlas palette
        background: "#FAF6F0", // Desert Sand
        surface: "#F3ECE1", // Wool Cream
        ink: "#2A211B", // Deep Espresso
        terracotta: "#8C583A", // Primary Accent
        terracottaDark: "#6E4228",
        gold: "#C59B27",

        // Supporting neutrals derived from the same earth tones
        line: "#E4D8C8",
        muted: "#7A6A5C",
        wool: "#E9DFD0",
      },
      fontFamily: {
        serif: [
          "var(--font-cormorant)",
          "Cormorant Garamond",
          "Georgia",
          "serif",
        ],
        sans: [
          "var(--font-jakarta)",
          "Plus Jakarta Sans",
          "Cairo",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      fontSize: {
        "display-sm": ["2.75rem", { lineHeight: "1.05", letterSpacing: "-0.02em" }],
        display: ["4rem", { lineHeight: "0.98", letterSpacing: "-0.025em" }],
        "display-lg": ["5.5rem", { lineHeight: "0.94", letterSpacing: "-0.03em" }],
      },
      letterSpacing: {
        luxe: "0.28em",
      },
      boxShadow: {
        soft: "0 18px 50px -28px rgba(42, 33, 27, 0.35)",
        card: "0 28px 80px -40px rgba(42, 33, 27, 0.45)",
        lift: "0 34px 90px -44px rgba(42, 33, 27, 0.55)",
        "luxury": "0 40px 100px -30px rgba(42, 33, 27, 0.5), 0 0 0 1px rgba(197, 155, 39, 0.1)",
        "glow": "0 0 40px -10px rgba(140, 88, 58, 0.3)",
        "inner": "inset 0 2px 4px 0 rgba(42, 33, 27, 0.06)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      backgroundImage: {
        // Subtle zellige-inspired lattice used as a section texture
        zellige:
          "linear-gradient(30deg, rgba(140, 88, 58, 0.055) 12%, transparent 12.5%, transparent 87%, rgba(140, 88, 58, 0.055) 87.5%, rgba(140, 88, 58, 0.055)), linear-gradient(150deg, rgba(140, 88, 58, 0.055) 12%, transparent 12.5%, transparent 87%, rgba(140, 88, 58, 0.055) 87.5%, rgba(140, 88, 58, 0.055)), linear-gradient(30deg, rgba(140, 88, 58, 0.055) 12%, transparent 12.5%, transparent 87%, rgba(140, 88, 58, 0.055) 87.5%, rgba(140, 88, 58, 0.055)), linear-gradient(150deg, rgba(140, 88, 58, 0.055) 12%, transparent 12.5%, transparent 87%, rgba(140, 88, 58, 0.055) 87.5%, rgba(140, 88, 58, 0.055)), linear-gradient(60deg, rgba(197, 155, 39, 0.05) 25%, transparent 25.5%, transparent 75%, rgba(197, 155, 39, 0.05) 75%, rgba(197, 155, 39, 0.05)), linear-gradient(60deg, rgba(197, 155, 39, 0.05) 25%, transparent 25.5%, transparent 75%, rgba(197, 155, 39, 0.05) 75%, rgba(197, 155, 39, 0.05))",
      },
      backgroundSize: {
        zellige: "64px 112px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "draw-line": {
          "0%": { transform: "scaleX(0)" },
          "100%": { transform: "scaleX(1)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) both",
        "draw-line": "draw-line 1s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both",
        marquee: "marquee 20s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
