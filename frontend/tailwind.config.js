/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Geist'", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        silkscreen: ["'Silkscreen'", "cursive"],
      },
    },
  },
  plugins: [],
};
