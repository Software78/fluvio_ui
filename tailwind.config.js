/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#0a0a0b',
        darkSurface: '#111113',
        darkBorder: '#1e1e22',
        textPrimary: '#e8e8ea',
        textMuted: '#6b6b72',
        accent: '#22c55e',
        danger: '#ef4444',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'IBM Plex Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

