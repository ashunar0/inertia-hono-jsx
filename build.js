#!/usr/bin/env node
import esbuild from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import { readFileSync } from 'fs'
import { readFile } from 'fs/promises'

const watch = process.argv.slice(1).includes('--watch')
const withDeps = process.argv.slice(1).includes('--with-deps')

let externalDependencies = undefined

if (withDeps) {
  const pkg = JSON.parse(readFileSync('./package.json', 'utf8'))
  externalDependencies = Object.keys(pkg.peerDependencies || {})
}

// Form / WhenVisible / InfiniteScroll は createElement や hook を `hono/jsx/dom` から取り込んでいる。
// この実体は `hono/jsx` と同じだが、`hono/jsx/dom` 由来のままだと SSR (hono/jsx/dom/server.renderToString)
// で `str.search is not a function` が出るため、ビルド時に runtime import を `hono/jsx` に差し替える。
// 型は build 後に消えるので影響しない（src 側は `hono/jsx/dom` の広い型を引き続き使える）。
const ssrRuntimeRedirect = {
  name: 'ssr-runtime-redirect',
  setup(build) {
    const filesNeedingRedirect = /\/(Form|WhenVisible|InfiniteScroll)\.tsx$/
    build.onLoad({ filter: filesNeedingRedirect }, async (args) => {
      const src = await readFile(args.path, 'utf8')
      const contents = src.replace(/(from\s+['"])hono\/jsx\/dom(['"])/g, '$1hono/jsx$2')
      return { contents, loader: 'tsx' }
    })
  },
}

const config = {
  bundle: true,
  minify: false,
  sourcemap: withDeps ? false : true,
  target: 'es2022',
  external: externalDependencies,
  jsx: 'automatic',
  jsxImportSource: 'hono/jsx',
  plugins: [
    ...(withDeps ? [] : [nodeExternalsPlugin()]),
    ssrRuntimeRedirect,
    {
      name: 'inertia',
      setup(build) {
        let count = 0
        build.onEnd(() => {
          if (count++ !== 0) {
            console.log(`Rebuilding ${build.initialOptions.entryPoints} (${build.initialOptions.format})…`)
          }
        })
      },
    },
  ],
}

const builds = [
  { entryPoints: ['src/index.ts'], format: 'esm', outfile: 'dist/index.js', platform: 'browser' },
  { entryPoints: ['src/server.ts'], format: 'esm', outfile: 'dist/server.js', platform: 'node' },
]

builds.forEach(async (build) => {
  const context = await esbuild.context({ ...config, ...build })

  if (watch) {
    console.log(`Watching ${build.entryPoints} (${build.format})…`)
    await context.watch()
  } else {
    await context.rebuild()
    context.dispose()
    console.log(`Built ${build.entryPoints} (${build.format}) ${withDeps ? '(with-deps)' : ''}…`)
  }
})
