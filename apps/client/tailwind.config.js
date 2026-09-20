/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bgPrimary: '#0A0E17',
        bgCard: '#141B2D',
        bgCardElevated: '#1C2540',
        accentBlue: '#4DA8FF',
        accentGreen: '#4ADE80',
        accentOrange: '#FB923C',
        accentRed: '#F87171',
        textPrimary: '#F1F5F9',
        textSecondary: '#94A3B8',
        trackLine: '#334155',
        mainline: '#4DA8FF',
        loopline: '#FB923C',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'monospace']
      }
    },
  },
  plugins: [],
}
