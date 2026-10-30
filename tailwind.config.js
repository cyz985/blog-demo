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
          50:  '#eef5ff',
          100: '#d9e7ff',
          200: '#bcd5ff',
          300: '#8eb8ff',
          400: '#5991ff',
          500: '#356dff',
          600: '#1f4ef5',
          700: '#1a3de0',
          800: '#1c36b5',
          900: '#1d338f',
        },
      },
      typography: () => ({}),
    },
  },
  plugins: [],
}
