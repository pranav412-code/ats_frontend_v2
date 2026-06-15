import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  loadEnv(mode, '.', '');
  const isProd = mode === 'production';
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    // Strip console/debugger from production bundles. Secrets are never
    // injected here — all client config comes from VITE_* env at build time.
    esbuild: isProd ? {drop: ['console', 'debugger']} : {},
    build: {
      // Split heavy vendors out of the app entry so first paint ships less JS
      // and long-cacheable chunks survive app-code changes.
      rollupOptions: {
        output: {
          manualChunks: {
            supabase: ['@supabase/supabase-js'],
            motion: ['motion'],
            dnd: ['@hello-pangea/dnd'],
          },
        },
      },
      chunkSizeWarningLimit: 700,
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify - file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
