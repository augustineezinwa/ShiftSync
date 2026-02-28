import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#0f1419",
        surfaceElevated: "#1a2332",
        border: "#2d3a4f",
        accent: "#3b82f6",
        accentMuted: "#1e3a5f",
        success: "#22c55e",
        warning: "#eab308",
        danger: "#ef4444",
        muted: "#64748b",
      },
      fontFamily: {
        sans: ["system-ui", "ui-sans-serif", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
