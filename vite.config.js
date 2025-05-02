import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/socket.io': {
        target: 'http://localhost:3000',
        ws: true
      }
    }
  },
  // Serve static files from public directory
  root: 'public',
  // Set the base to work with Laravel Herd's structure
  base: '/',
  
  // Specify build output directory to match Laravel's public path
  build: {
    // Output assets to the public/build directory
    outDir: 'build',
    rollupOptions: {
      input: '../src/app.js'
    }
  },
}); 