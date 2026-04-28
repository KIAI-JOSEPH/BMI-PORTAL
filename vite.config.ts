import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// BMI UMS - 100% Open Source Frontend
// Backend API: http://localhost:3001

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false
  }
});
