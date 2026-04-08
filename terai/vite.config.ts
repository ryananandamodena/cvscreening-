import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      }
    },
  },
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  plugins: [react()],
  // SECURITY: API keys are NOT injected into the frontend bundle.
  // All AI operations are proxied through the backend API for security.
  // The backend handles API keys server-side, preventing exposure in client-side code.
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
