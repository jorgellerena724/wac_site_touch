/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1C7790',
          dark: '#145A6E',
          light: '#E6F1F4',
        },
        accent: {
          DEFAULT: '#E58B6B',
          dark: '#C96A4A',
          light: '#FDF3EE',
        },
        surface: {
          DEFAULT: '#D4B895',
          light: '#EFE6D8',
        },
        background: {
          DEFAULT: '#F7F9F9',
        },
      },
    },
  },
  plugins: [],
}

