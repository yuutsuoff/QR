/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        glass: "rgba(255, 255, 255, 0.1)",
        gold: {
          DEFAULT: '#D4AF37',
          50: '#FBF8EF',
          100: '#F7F1DF',
          200: '#EDE2BE',
          300: '#E4D39D',
          400: '#DBC47D',
          500: '#D4AF37',
          600: '#B8860B',
          700: '#8A6508',
          800: '#5C4305',
          900: '#2E2203',
        }
      }
    },
  },
  plugins: [],
}
