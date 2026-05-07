import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@ts-76/inertia-hono-jsx': fileURLToPath(new URL('../src/index.ts', import.meta.url)),
    },
  },
  build: {
    manifest: true,
  },
})
