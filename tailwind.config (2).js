/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all of your component files.
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        brand: "#FF3008",
        "brand-hover": "#E62B07",
        surface: "#F7F7F7",
      },
    },
  },
  plugins: [],
};
