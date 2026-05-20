/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        reddit: "#FF4500",
        twitter: "#1D9BF0",
        discord: "#5865F2",
      },
    },
  },
  plugins: [],
};
