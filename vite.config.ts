import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  // Relative base so the build works under any path (e.g. GitHub Pages subfolder).
  base: './',
  plugins: [react(), tailwindcss()],
})
