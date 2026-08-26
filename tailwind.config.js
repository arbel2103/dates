/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // studio tokens — a quiet cream/rose room that belongs to the same
        // world as the gift sites without competing with them
        bg: 'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        line: 'rgb(var(--line) / <alpha-value>)',
        accent: 'rgb(var(--accent) / <alpha-value>)',
        'accent-soft': 'rgb(var(--accent-soft) / <alpha-value>)',
        gold: 'rgb(var(--gold) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Heebo', 'system-ui', 'sans-serif'],
        display: ['Suez One', 'Heebo', 'system-ui', 'sans-serif'],
        hand: ['Gveret Levin', 'Heebo', 'cursive'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
        '3xl': '1.5rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(36,27,50,0.05)',
        soft: '0 1px 3px rgba(36,27,50,0.07)',
        pop: '0 16px 48px -14px rgba(88,20,40,0.28)',
      },
    },
  },
  plugins: [],
}
