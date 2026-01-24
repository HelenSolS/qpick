
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Оставляем пустую строку для поддержки относительных путей (универсально для GitHub/Vercel)
  base: '',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    sourcemap: false
  },
  server: {
    port: 8080,
    host: true
  }
});
