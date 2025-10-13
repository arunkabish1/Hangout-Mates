import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ✅ Polyfill Node core modules for browser
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      events: 'events/',
      util: 'util/',
      stream: 'stream-browserify',
    },
  },
  optimizeDeps: {
    include: ['simple-peer', 'events', 'util', 'stream-browserify'],
  },
  define: {
    global: 'globalThis',
    // ✅ Fix "process is not defined"
    'process.env': {},
    process: { env: {} },
  },
});
  