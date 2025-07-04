/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_K8S_API || 'http://localhost:8080',
        changeOrigin: true,
        secure: Boolean(process.env.VITE_K8S_CA),
        headers: { 
          ...(process.env.VITE_K8S_TOKEN && {
            Authorization: `Bearer ${process.env.VITE_K8S_TOKEN}`
          })
        },
        ...(process.env.VITE_K8S_CA && {
          ssl: { ca: fs.readFileSync(process.env.VITE_K8S_CA) },
        }),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (_proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
