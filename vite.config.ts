import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { buildMarker } from './scripts/vite/buildMarker.mjs'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    allowedHosts: true,
    proxy: {
      '/api/v': {
        target: 'http://127.0.0.1:4040',
        changeOrigin: true,
      },
      '/body-exposure-cockpit': {
        target: 'http://127.0.0.1:4040',
        changeOrigin: true,
        rewrite: () => '/body-exposure',
      },
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8787',
        ws: true,
      },
    },
  },
  preview: {
    allowedHosts: true,
    proxy: {
      '/api/v': {
        target: 'http://127.0.0.1:4040',
        changeOrigin: true,
      },
      '/body-exposure-cockpit': {
        target: 'http://127.0.0.1:4040',
        changeOrigin: true,
        rewrite: () => '/body-exposure',
      },
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8787',
        ws: true,
      },
    },
  },
  // Relative base so the build works under any path (e.g. GitHub Pages subfolder).
  base: './',
  plugins: [react(), tailwindcss(), buildMarker()],
  build: {
    // Preserve the Vite 5 browser baseline when upgrading the build tool.
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    rollupOptions: {
      output: {
        // Home's lazy CSS must keep a stable URL across deployments; old tabs
        // must not request deleted Home-<hash>.css. Other assets remain hashed.
        assetFileNames: (asset) => asset.name === 'Home.css' ? 'assets/Home.css' : 'assets/[name]-[hash][extname]',
        // Split rarely-changing vendor code into its own chunk so returning
        // visitors re-download only app code on each deploy (better caching).
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})
