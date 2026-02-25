import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: { 
    alias: { '@': path.resolve(__dirname, './src') } 
  },
  server: {
    proxy: { '/api': { target: 'http://localhost:3001', changeOrigin: true } }
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts'],
          'animation': ['framer-motion'],
          'icons': ['lucide-react']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimize: {
    esbuild: {
      drop: ['console', 'debugger']
    }
  }
})
