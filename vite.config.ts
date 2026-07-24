/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';

import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const stylesDir = fileURLToPath(new URL('./src/styles', import.meta.url));

export default defineConfig({
  base: '/',
  // Build-time year, baked into both the SSG server render and the client bundle
  // so hydration matches; Contact then updates to the live client year on mount.
  define: {
    __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()),
  },
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  css: {
    preprocessorOptions: {
      scss: { loadPaths: [stylesDir] },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: true,
  },
});
