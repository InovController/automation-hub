/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-3%, 3%) scale(1.08)' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 2px 0 rgba(4, 120, 87, 0.35)' },
          '50%': { boxShadow: '0 0 7px 2px rgba(4, 120, 87, 0.7)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both',
        drift: 'drift 18s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 2.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
