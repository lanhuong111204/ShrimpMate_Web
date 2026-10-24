/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        shrimp: {
          DEFAULT: '#EA580C',
          hover: '#C2410C',
          light: '#FFDBCA',
          tint: '#FFF8F5',
          dark: '#9D4300',
          gradientStart: '#FB923C',
        },
        bio: {
          DEFAULT: '#006E2D',
          light: '#E8F5E9',
          tint: '#F0FDF4',
          border: '#7CF994',
          bright: '#7FFC97',
          dark: '#005320',
        },
        ocean: {
          DEFAULT: '#006398',
          bright: '#40A2E7',
          light: '#EFF4FF',
          border: '#D3E4FE',
          navy: '#0B1C30',
          navyCard: '#131B2E',
          dark: '#0f172a',
          card: '#1e293b',
          cyan: '#06b6d4',
          teal: '#14b8a6',
        },
        danger: {
          DEFAULT: '#BA1A1A',
          light: '#FFDAD6',
          tint: '#FFF8F8',
          dark: '#93000A',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
