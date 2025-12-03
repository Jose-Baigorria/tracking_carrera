/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
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
        background: {
          DEFAULT: '#1e1e1e',
          light: '#252526',
          lighter: '#2d2d30',
          dark: '#181818'
        },
        surface: {
          DEFAULT: '#252526',
          light: '#2d2d30',
          lighter: '#3e3e42',
          dark: '#1e1e1e'
        },
        text: {
          primary: '#d4d4d4',
          secondary: '#858585',
          disabled: '#656565'
        },
        border: {
          DEFAULT: '#3e3e42',
          light: '#464648',
          dark: '#2d2d30'
        }
      }
    },
  },
  plugins: [],
}