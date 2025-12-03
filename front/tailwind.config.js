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
        // 更贴近 OpenAI 的低饱和中性色系：以中性灰为基，少量绿色强调
        "primary": "#10a37f", // ChatGPT 绿，适量使用
        "background-light": "#f8fafc",
        "background-dark": "#0b141c",
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
