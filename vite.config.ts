import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { buildMarker } from './scripts/vite/buildMarker.mjs'

// https://vitejs.dev/config/
export default defineConfig({
  // Relative base so the build works under any path (e.g. GitHub Pages subfolder).
  base: './',
  plugins: [react(), tailwindcss(), buildMarker()],
  build: {
    // Preserve the Vite 5 browser baseline when upgrading the build tool.
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    rollupOptions: {
      output: {
        // Split rarely-changing vendor code into its own chunk so returning
        // visitors re-download only app code on each deploy (better caching).
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
