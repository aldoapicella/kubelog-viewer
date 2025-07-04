import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_K8S_API,
        changeOrigin: true,
        secure: Boolean(process.env.VITE_K8S_CA),
        rewrite: p => p.replace(/^\/api/, ''),
        headers: { Authorization: `Bearer ${process.env.VITE_K8S_TOKEN}` },
        ...(process.env.VITE_K8S_CA && {
          ssl: { ca: fs.readFileSync(process.env.VITE_K8S_CA) },
        }),
      },
    },
  },
});
