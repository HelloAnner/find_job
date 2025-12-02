/** @type {import('tailwindcss').Config} */
import forms from "@tailwindcss/forms";

export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "primary": "#3994ef",
        "background-light": "#f6f7f8",
        "background-dark": "#101922",
      },
      fontFamily: {
        "display": ["Inter", "Noto Sans", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "0.75rem",
        "xl": "1rem",
        "full": "9999px"
      },
    },
  },
  plugins: [forms()],
}
