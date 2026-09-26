import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  root: resolve(__dirname, '../..'),
  optimizeDeps: { entries: ['tools/studio-framing/index.html'] },
  server: { host: '127.0.0.1', port: 5184, strictPort: true },
});
