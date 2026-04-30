# Inertia Hono JSX Sample

This sample follows the Hono Vite template shape: a single `vite` dev server runs the Hono app,
and client assets are injected with `vite-ssr-components`.

The Inertia split is:

- `@hono/inertia` handles the Hono server protocol and `c.render()`.
- `@ts-76/inertia-hono-jsx` handles the client adapter and Hono JSX DOM rendering.

```sh
npm install
npm run dev
```

Open:

```txt
http://localhost:5173
```

This directory is a repository sample only. It is intentionally not included in the adapter package
build or npm package contents.
