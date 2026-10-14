/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Open Sans"',
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      colors: {
        // Paleta de marca
        brand: {
          50: "#f1efff",
          100: "#e4e0fb",
          200: "#c8bff3",
          300: "#a79ae6",
          400: "#7d70c9",
          500: "#3a22d4",
          600: "#1b01bc",
          700: "#1f0e8f",
          800: "#190b70",
          900: "#120852",
          950: "#0b0533",
        },
        coral: {
          50: "#fff5f1",
          100: "#fde7df",
          200: "#f2c0b1",
          300: "#f8b49b",
          400: "#faa180",
          500: "#f08560",
          600: "#d96a45",
        },
        cream: "#fcf7f0",
        lilac: "#c8bff3",
        lavender: "#7d70c9",
        blush: "#f2c0b1",
        navy: "#1f0e8f",
        ink: "#1a1446",

        // Alias semánticos (usados en algunos componentes)
        primary: {
          DEFAULT: "#1b01bc",
          dark: "#1f0e8f",
          light: "#e4e0fb",
        },
        accent: {
          DEFAULT: "#faa180",
          light: "#fde7df",
        },
        surface: {
          DEFAULT: "#ece8fb",
          light: "#fcf7f0",
        },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(26, 20, 70, 0.04), 0 8px 24px -8px rgba(26, 20, 70, 0.10)",
        card: "0 1px 3px rgba(26, 20, 70, 0.05), 0 12px 32px -12px rgba(27, 1, 188, 0.18)",
        lift: "0 2px 6px rgba(26, 20, 70, 0.06), 0 24px 48px -16px rgba(27, 1, 188, 0.28)",
        glow: "0 10px 30px -10px rgba(27, 1, 188, 0.55)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};
