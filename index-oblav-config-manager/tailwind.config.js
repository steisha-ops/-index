/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        macBg: "#1e1e1e",
        macSidebar: "rgba(0,0,0,0.3)",
        macBorder: "rgba(255,255,255,0.1)",
        macBlue: "#007AFF"
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif']
      }
    },
  },
  plugins: [],
}
