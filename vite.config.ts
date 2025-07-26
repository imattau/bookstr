import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({ srcDir: 'src', filename: 'sw.ts', strategies: 'injectManifest' }),
  ],
  build: {
    outDir: 'dist',
  },
});
