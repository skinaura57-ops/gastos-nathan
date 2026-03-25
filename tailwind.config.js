/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#84cc16',
        'accent-dark': '#65a30d',
        surface: '#1e1e2e',
        'surface-light': '#2a2a3e',
        'surface-lighter': '#363650',
        border: '#3a3a5c',
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
