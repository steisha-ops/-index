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
    target: ['esnext', 'ios13'],
    minify: 'terser',
    sourcemap: false,
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        passes: 2,
        pure_funcs: ['console.log', 'console.info'],
        unsafe: true,
        unsafe_arrows: true
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
        manualChunks: (id) => {
          // Vendor разбивка с более умной стратегией
          if (id.includes('node_modules/react')) return 'vendor-react';
          if (id.includes('node_modules/react-router')) return 'vendor-router';
          if (id.includes('node_modules/recharts')) return 'vendor-charts';
          if (id.includes('node_modules/framer-motion')) return 'vendor-animation';
          if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
          if (id.includes('node_modules')) return 'vendor';
          // Разделение по компонентам страниц для lazy loading
          if (id.includes('/pages/')) return 'pages';
          if (id.includes('/components/')) return 'components';
          if (id.includes('/lib/')) return 'lib';
        },
        entryFileNames: 'js/[name].[hash].js',
        chunkFileNames: 'js/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash][extname]'
      }
    },
    chunkSizeWarningLimit: 1500,
    // Оптимизация для мобильных
    reportCompressedSize: false,
    // Специально для iOS - меньше памяти при загрузке
    cssCodeSplit: true,
    assetsInlineLimit: 4096
  },
  css: {
    postcss: './postcss.config.js'
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'recharts', 'framer-motion', 'lucide-react']
  }
})
