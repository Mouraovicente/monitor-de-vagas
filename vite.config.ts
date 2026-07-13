import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    port: 5173,
    open: true,
  },
  resolve: {
    alias: {
      '@domain': '/src/domain',
      '@infrastructure': '/src/infrastructure',
      '@ui': '/src/ui',
    },
  },
});
