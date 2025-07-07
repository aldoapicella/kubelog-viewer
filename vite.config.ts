/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs   from 'node:fs';
import path from 'node:path';

/**
 * Vite config that works both:
 *  • **Locally** → proxies `/api/**` to your external API server
 *  • **Inside AKS** → skips the proxy because the UI pod will talk to
 *     `https://kubernetes.default.svc` directly
 *
 * Extra env vars (all optional)
 * --------------------------------
 * VITE_K8S_API   – https://<api-server>:443
 * VITE_K8S_TOKEN – SA token for local dev
 * VITE_K8S_CA    – path to CA file (PEM) for local dev
 * VITE_IN_CLUSTER = true → disables the proxy
 */
export default ({ mode }: { mode: string }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  // Running in a pod?  K8s injects these vars.
  const inCluster =
    env.VITE_IN_CLUSTER === 'true' ||
    !!process.env.KUBERNETES_SERVICE_HOST;

  return defineConfig({
    plugins: [react()],

    /** dev-server (only used when NOT in the cluster) */
    server: inCluster
      ? undefined
      : {
          proxy: {
            '/api': {
              target: env.VITE_K8S_API,
              changeOrigin: true,
              /**
               * When you supply a custom CA we *do* want TLS verified,
               * otherwise leave it off while you’re still debugging.
               */
              secure: Boolean(env.VITE_K8S_CA),
              headers: env.VITE_K8S_TOKEN
                ? { Authorization: `Bearer ${env.VITE_K8S_TOKEN}` }
                : undefined,
              ...(env.VITE_K8S_CA && {
                ssl: {
                  ca: fs.readFileSync(
                    path.resolve(env.VITE_K8S_CA),
                  ),
                },
              }),
              /** nice-to-have debug hooks */
              configure(proxy) {
                proxy.on('proxyReq', (_pReq, req) => {
                  console.log('→ proxying:', req.method, req.url);
                });
                proxy.on('error', (err) =>
                  console.error('proxy error', err),
                );
              },
            },
          },
        },
  });
};
