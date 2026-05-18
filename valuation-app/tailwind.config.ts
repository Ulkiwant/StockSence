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
        background: {
          primary: "#111110",
          card: "#1c1b1a",
          hover: "#242320",
        },
        text: {
          primary: "#fafaf9",
          secondary: "#a8a29e",
          tertiary: "#78716c",
          disabled: "#57534e",
        },
        accent: {
          DEFAULT: "#86efac",
          hover: "#4ade80",
          solid: "#22c55e",
        },
        success: "#86efac",
        danger: "#fca5a5",
        warning: "#fcd34d",
      },
    },
  },
  plugins: [],
};

export default config;
