import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        safety: {
          bg: "#0B0F19",
          card: "#111827",
          border: "#1F2937",
          hover: "#1E293B",
          accent: "#3B82F6",
          critical: "#EF4444",
          high: "#F97316",
          medium: "#EAB308",
          low: "#10B981",
          info: "#06B6D4",
        },
      },
    },
  },
  plugins: [],
};
export default config;
