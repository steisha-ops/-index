import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: 'react',
      babel: {
        plugins: [
          ['@babel/plugin-proposal-decorators', { legacy: true }]
        ]
      }
    })
  ],
  resolve: { 
    alias: { '@': path.resolve(__dirname, './src') }
  },
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: false,
    allowedHosts: ['localhost', '127.0.0.1'],
    proxy: { 
      '/api': { 
        target: 'http://localhost:3001', 
        changeOrigin: true,
        ws: true
      }
    }
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2
      },
      mangle: {
        safari10: true
      },
      output: {
        comments: false
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts': ['recharts'],
          'animation': ['framer-motion'],
          'icons': ['lucide-react']
        },
        entryFileNames: 'js/[name].[hash].js',
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    },
    chunkSizeWarningLimit: 1000,
    // Оптимизация для мобильных
    reportCompressedSize: false
  },
  css: {
    postcss: './postcss.config.js'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'recharts', 'framer-motion', 'lucide-react']
  }
})
