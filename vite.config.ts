import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/KopdesMerahPutih-Kel-9/',

  plugins: [
    react(),
    tailwindcss(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  server: {
    // HMR disabled in AI Studio via DISABLE_HMR env var
    hmr: process.env.DISABLE_HMR !== 'true',

    // Disable file watching when HMR is off
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});