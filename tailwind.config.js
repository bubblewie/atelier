/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./resources/**/*.blade.php",
    "./resources/**/*.js",
    "./resources/**/*.vue",
  ],
  theme: {
    extend: {
      colors: {
        // Warna kustom pastel aesthetic kita
        pastel: {
          pink: '#FDE2E4',
          blue: '#E2ECE9',
          cream: '#FFF1E6',
          dark: '#5D576B'
        }
      }
    },
  },
  plugins: [],
}