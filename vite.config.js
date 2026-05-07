import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsDir: 'assets',
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          // Globe.GL + Three.js — pesados, separados pra carregar em paralelo
          // enquanto o loading screen está visível.
          globe: ['globe.gl']
        }
      }
    },
    chunkSizeWarningLimit: 700
  },
  server: {
    port: 3000,
    open: true
  }
});
