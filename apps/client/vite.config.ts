import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
// Relative import: Vite bundles it, whereas the workspace package would be externalized as raw .ts.
import { API_PREFIX, DEFAULT_PORT } from '../../packages/shared/src/constants';

const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, '');
  const target = `http://localhost:${env.PORT || DEFAULT_PORT}`;

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      host: true,
      port: 5173,
      proxy: {
        [API_PREFIX]: { target, xfwd: true },
        '/socket.io': { target, ws: true, xfwd: true },
      },
    },
  };
});
