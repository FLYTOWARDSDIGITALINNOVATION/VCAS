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
      }
    },
  },
  plugins: [],
}
