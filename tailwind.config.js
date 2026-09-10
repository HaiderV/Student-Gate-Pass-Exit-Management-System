/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060c18',
          900: '#0a1424',
          850: '#0d1a2e',
          800: '#112138',
          750: '#152a46',
          700: '#1b3457',
          600: '#26456f',
          500: '#33598d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(3, 10, 24, 0.35), 0 12px 32px -16px rgba(3, 10, 24, 0.55)',
        pop: '0 20px 50px -12px rgba(3, 10, 24, 0.7)',
      },
    },
  },
  plugins: [],
};
