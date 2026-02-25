import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Проксируем все запросы, начинающиеся с /api, на наш бэкенд-сервер
      '/api': {
        target: 'http://localhost:3002',
        changeOrigin: true, // Необходимо для корректной работы прокси
        secure: false,      // Можно использовать для http-бэкендов
      },
    },
  },
});
