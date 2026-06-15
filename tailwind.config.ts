import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        card: 'var(--card)',
        card2: 'var(--card2)',
        border: 'var(--border)',
        gold: {
          DEFAULT: 'var(--gold)',
          light: 'var(--gold-light)',
          muted: 'rgba(201, 168, 76, 0.15)',
          glow: 'var(--gold-glow)',
        },
        purple: 'var(--purple)',
        text: {
          primary: 'var(--text)',
          muted: 'var(--muted)',
        },
        success: 'var(--success)',
        error: 'var(--error)',
      },
      fontFamily: {
        heading: ["var(--font-heading)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      borderRadius: {
        lg: "16px",
        md: "10px",
        sm: "8px",
      },
    },
  },
  plugins: [],
};
export default config;
