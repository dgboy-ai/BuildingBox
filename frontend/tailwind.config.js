/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#FAF7F2',
          100: '#F6F0E5',
          200: '#EDE4D3',
          300: '#DFD1B8'
        },
        forest: {
          50: '#F0F5F2',
          100: '#DDE9E2',
          500: '#2D5947',
          600: '#244638',
          700: '#1C382D',
          800: '#142921',
          900: '#0E1D17',
          950: '#08110D'
        },
        rescue: {
          100: '#FDEEE4',
          400: '#E88B4B',
          500: '#D97732',
          600: '#BF6223'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
