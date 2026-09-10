import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    allowedHosts: true,
  },
  optimizeDeps: {
    // Only scan the app entry — ignore unrelated files in the workspace root.
    entries: ['index.html'],
  },
  preview: {
    host: true,
    port: 3000,
    strictPort: true,
    allowedHosts: true,
  },
});
