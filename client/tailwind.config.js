/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Safe (>75%): Emerald (text-emerald-400)
        // Danger (<75%): Rose (text-rose-500)
        // Brand: Indigo/Violet (bg-indigo-600)
        // Backgrounds: Deep Slate/Gray (bg-slate-900 to bg-slate-800)
        // Text: High contrast (text-slate-50)
      }
    },
  },
  plugins: [],
}
