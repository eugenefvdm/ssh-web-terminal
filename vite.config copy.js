import { defineConfig } from 'vite';

export default defineConfig({
  root: 'public',
  server: {
    port: 3000,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
}); 