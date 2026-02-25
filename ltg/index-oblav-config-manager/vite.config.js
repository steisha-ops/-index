import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Рабочая конфигурация прокси (как в widget)
export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: {
    port: 7000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
