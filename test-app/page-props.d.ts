import '@ts-76/inertia-hono-jsx'

declare module '@ts-76/inertia-hono-jsx' {
  interface InertiaPageProps {
    Dump: {
      method: string
    }
    Home: {
      deferredExample?: string
      example: string
    }
    'Hono/FormAdvanced': {
      submitted: Record<string, unknown> | null
      uploadName: string | null
    }
    'Hono/FormFields': {
      submitted: Record<string, unknown> | null
    }
    'Hono/LayoutProps': {
      preserve: boolean
    }
    'Hono/Partial': {
      message: string
      other: string
    }
    'Hono/Target': {
      message: string
    }
    'Hono/UsePage': {
      name: string
    }
    'Hono/VisitHelpers': {
      pollCount: number
      visibleValue?: string
    }
    'InfiniteScroll/Manual': {
      users: {
        data: Array<{ id: number; name: string }>
      }
    }
    'InfiniteScroll/ManualReverse': {
      users: {
        data: Array<{ id: number; name: string }>
      }
    }
  }
}
