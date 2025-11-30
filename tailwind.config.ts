import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['var(--font-playfair)', 'serif'],
        sans: ['var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        'editorial': '0 2px 10px rgba(0, 0, 0, 0.03), 0 10px 25px rgba(0, 0, 0, 0.04)',
      },
      // Add the animation here so Tailwind knows about it
      animation: {
        'pulse-ring': 'pulse-ring 10s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.8)', opacity: '0.8' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
};
export default config;