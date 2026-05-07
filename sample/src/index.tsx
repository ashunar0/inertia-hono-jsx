/** @jsxImportSource hono/jsx */
import { inertia, serializePage, type PageObject, type RootView } from '@hono/inertia'
import { Hono, type Context, type TypedResponse } from 'hono'
import { renderToString } from 'hono/jsx/dom/server'
import { Link as ViteLink, Script, ViteClient } from 'vite-ssr-components/hono'

const version = 'hono-vite-sample'

const users = [
  { id: 1, name: 'Taka', role: 'Designer' },
  { id: 2, name: 'Mika', role: 'Engineer' },
  { id: 3, name: 'Ren', role: 'Product' },
]

const scrollUsers = Array.from({ length: 24 }, (_, index) => ({
  id: index + 1,
  name: `Scroll User ${index + 1}`,
}))

function paginateScrollUsers(page: number, perPage = 8, pageName = 'page') {
  const start = (page - 1) * perPage
  const data = scrollUsers.slice(start, start + perPage)
  const previousPage = page > 1 ? page - 1 : null
  const nextPage = start + perPage < scrollUsers.length ? page + 1 : null

  return {
    page: {
      current_page: page,
      data,
      per_page: perPage,
      total: scrollUsers.length,
    },
    scrollProp: {
      pageName,
      previousPage,
      nextPage,
      currentPage: page,
      reset: false,
    },
  }
}

const rootView: RootView = (page) => `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Hono JSX Inertia Sample</title>
    ${renderToString(<ViteClient />)}
    ${renderToString(<ViteLink href="/src/style.css" rel="stylesheet" />)}
  </head>
  <body>
    <script data-page="app" type="application/json">${serializePage(page)}</script>
    <div id="app"></div>
    ${renderToString(<Script src="/src/client.tsx" />)}
  </body>
</html>`

type PageResponseWithExtras<
  Component extends string,
  Props extends Record<string, unknown>,
  Extras extends Record<string, unknown>,
> = Response & TypedResponse<PageObject<Props> & { component: Component; props: Props } & Extras, 200, 'json'>

function renderPageWithExtras<
  Component extends string,
  Props extends Record<string, unknown>,
  Extras extends Record<string, unknown>,
>(
  c: Context,
  component: Component,
  props: Props,
  extras: Extras,
): PageResponseWithExtras<Component, Props, Extras> {
  const url = new URL(c.req.url)
  const page = {
    component,
    props,
    url: url.pathname + url.search,
    version,
    ...extras,
  }

  if (c.req.header('x-inertia')) {
    return c.json(page, 200, {
      'X-Inertia': 'true',
      Vary: 'X-Inertia',
    }) as PageResponseWithExtras<Component, Props, Extras>
  }

  return c.html(rootView(page, c)) as PageResponseWithExtras<Component, Props, Extras>
}

const app = new Hono()
  .use(inertia({ version, rootView }))
  .get('/', (c) => {
    const partialData = c.req.header('x-inertia-partial-data')?.split(',') ?? []
    const wantsStats = partialData.includes('stats')

    return c.render('Home', {
      message: 'Hello from a Hono Vite server',
      ...(wantsStats ? { stats: { visits: 42 } } : {}),
      users,
    })
  })
  .get('/users', (c) =>
    c.render('Users/Index', {
      users,
    }),
  )
  .get('/users/:id', (c) => {
    const user = users.find((candidate) => candidate.id === Number(c.req.param('id')))

    if (!user) {
      return c.notFound()
    }

    return c.render('Users/Show', {
      user,
    })
  })
  .get('/adapter/form', (c) =>
    c.render('Adapter/Form', {
      submitted: null,
    }),
  )
  .post('/adapter/form/success', async (c) => {
    const body = await c.req.parseBody({ all: true })

    return c.render('Adapter/Form', {
      submitted: body,
    })
  })
  .post('/adapter/form/cancel-slow', async (c) => {
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return c.render('Adapter/Form', {
      submitted: await c.req.parseBody({ all: true }),
    })
  })
  .get('/adapter/head', (c) => c.render('Adapter/HeadKeys'))
  .get('/adapter/infinite', (c) => {
    const manualPage = Number(c.req.query('manualPage') ?? c.req.query('page') ?? 2)
    const autoPage = Number(c.req.query('autoPage') ?? 1)
    const manual = paginateScrollUsers(manualPage, 8, 'manualPage')
    const auto = paginateScrollUsers(autoPage, 6, 'autoPage')

    return renderPageWithExtras(
      c,
      'Adapter/InfiniteReverse',
      {
        manualUsers: manual.page,
        autoUsers: auto.page,
      },
      {
        scrollProps: {
          manualUsers: manual.scrollProp,
          autoUsers: auto.scrollProp,
        },
        mergeProps: ['autoUsers.data'],
        prependProps: ['manualUsers.data'],
        matchPropsOn: ['autoUsers.data.id', 'manualUsers.data.id'],
      },
    )
  })

export default app
