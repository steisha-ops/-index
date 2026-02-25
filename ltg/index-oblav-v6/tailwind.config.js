export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        glass: "rgba(255, 255, 255, 0.08)",
        glassBorder: "rgba(255, 255, 255, 0.15)",
        macosBg: "#1e1e1e",
        neonRed: "#FF3B30",
        neonGreen: "#34C759",
      },
      animation: { 'pulse-slow': 'pulse 3s infinite' }
    },
  },
  plugins: [],
}
