import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const fplProxy = {
  '/fpl-api': {
    target: 'https://fantasy.premierleague.com',
    changeOrigin: true,
    rewrite: (path: string) => path.replace(/^\/fpl-api/, '/api'),
  },
};

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: true,
    proxy: fplProxy,
  },
  preview: {
    port: 3001,
    proxy: fplProxy,
  },
});
