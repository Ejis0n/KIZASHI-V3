/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        radar: {
          bg: "#0a0e17",
          panel: "#0d1220",
          border: "#1e2a3a",
          neon: "#00d4aa",
          neonDim: "rgba(0, 212, 170, 0.4)",
          hot: "#ff3366",
          warm: "#ffaa00",
          cold: "#00aaff",
          text: "#c8d4e0",
          mute: "#6b7c8f",
        },
      },
      boxShadow: {
        glow: "0 0 20px rgba(0, 212, 170, 0.15)",
        glowStrong: "0 0 24px rgba(0, 212, 170, 0.25)",
      },
    },
  },
  plugins: [],
};
