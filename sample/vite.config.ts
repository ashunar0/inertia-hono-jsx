import { cloudflare } from '@cloudflare/vite-plugin'
import { inertiaPages } from '@hono/inertia/vite'
import { defineConfig } from 'vite'
import ssrPlugin from 'vite-ssr-components/plugin'

export default defineConfig({
  plugins: [
    cloudflare(),
    inertiaPages({
      pagesDir: 'src/Pages',
      outFile: 'src/pages.gen.ts',
      serverModule: './index',
    }),
    ssrPlugin(),
  ],
})
