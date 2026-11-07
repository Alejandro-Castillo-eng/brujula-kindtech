import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// `base: './'` genera rutas relativas, así el mismo build funciona en
// GitHub Pages (https://<usuario>.github.io/brujula-kindtech/) y en cualquier
// otro hosting estático. La navegación usa el hash (#explore, #route…).
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
});
