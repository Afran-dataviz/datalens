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
        background: '#080A0F',
        card: '#0E1117',
        card2: '#141720',
        border: '#1E2130',
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E8C97A',
          muted: '#C9A84C20',
          glow: 'rgba(201, 168, 76, 0.15)',
        },
        purple: '#8B6FBB',
        text: {
          primary: '#F5F0E8',
          muted: '#6B7280',
        },
        success: '#2ECC71',
        error: '#E74C3C',
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
