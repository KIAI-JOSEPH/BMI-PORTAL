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
        target: 'http://127.0.0.1:3001',
        changeOrigin: true,
        secure: false
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
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          if (id.includes('html2pdf.js')) return 'vendor-html2pdf';
          if (id.includes('xlsx')) return 'vendor-xlsx';
          if (id.includes('recharts')) return 'vendor-charts';
          if (id.includes('file-saver')) return 'vendor-files';
          if (id.includes('qrcode') || id.includes('jsqr')) return 'vendor-qr';
          if (id.includes('lucide-react')) return 'vendor-icons';

          return undefined;
        },
      },
    },
  }
});
