/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        vcas: {
          darkBg: '#091527',
          panelDark: '#122b46',
          accent: '#2563eb',
          accentLight: '#3b82f6',
          textMuted: '#94a3b8',
          cardBg: '#0e233b',
          borderDark: '#1e3a5f'
        }
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleUp: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.15s ease-out forwards',
        scaleUp: 'scaleUp 0.15s ease-out forwards',
        slideRight: 'slideRight 0.2s ease-out forwards',
      }
    },
  },
  plugins: [],
}
