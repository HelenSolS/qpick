
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Оставляем '/' для Vercel, это стандарт.
  base: '/',
  define: {
    'process.env': {}
  },
  server: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
