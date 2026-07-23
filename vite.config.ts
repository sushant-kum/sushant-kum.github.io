/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { fileURLToPath } from 'node:url'

const stylesDir = fileURLToPath(new URL('./src/styles', import.meta.url))

export default defineConfig({
  base: '/',
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
})
