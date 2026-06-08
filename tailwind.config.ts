import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink:           "#0a1628",
        paper:         "#f5f1ea",
        "paper-2":     "#ece6db",
        "paper-3":     "#e4ddd0",
        line:          "#d8d0c0",
        muted:         "#6b6356",
        accent:        "#2d7d5a",
        "accent-soft": "#d4e5dc",
        "signal-up":   "#2d7d5a",
        "signal-down": "#b84a3a",
        "signal-neutral": "#8b7a5e",
      },
      fontFamily: {
        sans:      ["var(--font-geist)", "system-ui", "sans-serif"],
        mono:      ["var(--font-geist-mono)", "monospace"],
        serif:     ["var(--font-instrument)", "Georgia", "serif"],
      },
      borderRadius: {
        pill: "9999px",
        card: "16px",
      },
    },
  },
  plugins: [],
};

export default config;
