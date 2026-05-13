import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f7f7f6",
          100: "#eeeeec",
          200: "#dcdcd8",
          300: "#bbbbb4",
          400: "#8e8e85",
          500: "#6b6b62",
          600: "#52524a",
          700: "#3f3f39",
          800: "#26261f",
          900: "#161611",
          950: "#0a0a07",
        },
        accent: {
          50: "#fefbe8",
          100: "#fff5c2",
          200: "#ffe888",
          300: "#ffd544",
          400: "#fbbf24",
          500: "#eaa007",
          600: "#ca7a04",
          700: "#a15808",
          800: "#854610",
          900: "#723a13",
        },
        rose: {
          500: "#e11d48",
          50: "#fff1f2",
        },
        sage: {
          500: "#10b981",
          50: "#ecfdf5",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 1px 3px 0 rgb(0 0 0 / 0.06)",
        card: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
