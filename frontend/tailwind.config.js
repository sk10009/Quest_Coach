/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        quest: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          primary: '#6366f1',
          primaryHover: '#4f46e5',
          accent: '#10b981',
          gold: '#f59e0b',
          danger: '#ef4444'
        }
      }
    },
  },
  plugins: [],
}
