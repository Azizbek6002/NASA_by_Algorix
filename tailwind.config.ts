import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./features/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#05070A",
          900: "#0B0F14",
          850: "#0E141B",
          800: "#111820",
          700: "#18212C",
        },
        mist: {
          50: "#F5F7FA",
          300: "#C3CAD4",
          500: "#8B96A5",
          600: "#6F7B8A",
        },
        orbit: "#55C8FF",
        artifact: "#E5B45C",
        warning: "#F07854",
        success: "#70C99B",
        debris: "#8B96A5",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      letterSpacing: {
        tightest: "-0.035em",
        widest2: "0.22em",
      },
      maxWidth: {
        shell: "1560px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scan: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
        scan: "scan 2.8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
