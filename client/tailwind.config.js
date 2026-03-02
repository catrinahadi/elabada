/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        maroon: {
          50: "#FFF5F5",
          100: "#FFE0E0",
          200: "#FFC2C2",
          300: "#FF9494",
          400: "#E05555",
          500: "#C02020",
          600: "#8B0000",
          700: "#6B0000",
          800: "#500000",
          900: "#3A0000",
        },
        cream: {
          50: "#FFFDF9",
          100: "#FEF7F0",
          200: "#FDE8D5",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        "card": "0 1px 4px 0 rgba(0,0,0,0.06), 0 4px 16px 0 rgba(0,0,0,0.08)",
        "card-hover": "0 8px 32px 0 rgba(0,0,0,0.14), 0 2px 8px 0 rgba(0,0,0,0.08)",
        "modal": "0 24px 64px 0 rgba(0,0,0,0.24)",
        "navbar": "0 1px 0 0 rgba(0,0,0,0.08)",
      },
      borderRadius: {
        "2.5xl": "20px",
      },
    },
  },
  plugins: [],
}
