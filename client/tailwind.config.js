/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#f5f2ec",
        cream2: "#ede9e0",
        cream3: "#e4dfd4",
        gold: "#b8922a",
        gold2: "#c9a440",
        "gold-light": "#e8c96a",
        dark: "#1a1a14",
        dark2: "#2c2c22",
        mid: "#5a5a48",
        muted: "#8a8a72",
        muted2: "#b0ab98",
        green: "#3a7d5c",
        "green-light": "#e8f4ee",
        blue: "#2a5a8a",
        "blue-light": "#e8f0f8",
        "amber-light": "#fdf3e0",
        danger: "#c0392b",
        "danger-light": "#fdecea",
      },
      fontFamily: {
        display: ["Playfair Display", "Georgia", "serif"],
        body: ["Cormorant Garamond", "Georgia", "serif"],
        ui: ["DM Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
