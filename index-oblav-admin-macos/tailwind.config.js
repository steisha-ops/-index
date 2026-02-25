export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'] },
      colors: {
        macWindow: "#1e1e1e",
        macSidebar: "#252526",
        macSelect: "#007AFF"
      }
    },
  },
  plugins: [],
}
