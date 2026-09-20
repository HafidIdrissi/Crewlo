import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
// A separate renderer for isolated visual checks; never restarts the user's engine.
export default defineConfig({
  root: resolve(__dirname, '../src/renderer'),
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify('0.4.6') },
  resolve: { alias: {
    '@': resolve(__dirname, '../src/renderer/src'),
    '@shared': resolve(__dirname, '../src/shared'),
    '@brand': resolve(__dirname, '../docs'),
  } },
  server: { port: 5175, strictPort: true },
});
