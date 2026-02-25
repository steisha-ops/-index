import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
export default defineConfig({
  plugins: [react()],
  server: {
    port: 9000,
    proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true, secure: false } }
  }
})
