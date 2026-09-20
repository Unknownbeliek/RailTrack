import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Custom plugin to parse .geojson as JSON
function geojsonPlugin() {
  return {
    name: 'geojson-loader',
    transform(code: string, id: string) {
      if (id.endsWith('.geojson')) {
        return {
          code: `export default ${code};`,
          map: null,
        };
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), geojsonPlugin()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://127.0.0.1:4000',
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
