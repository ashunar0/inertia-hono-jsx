import type { FormDataConvertible } from '@inertiajs/core'

type User = {
  id: number
  name: string
  role: string
}

type ScrollUser = {
  id: number
  name: string
}

type PaginatedUsers = {
  data: ScrollUser[]
  current_page: number
  per_page: number
  total: number
}

declare module '@ts-76/inertia-hono-jsx' {
  interface InertiaPageProps {
    Home: {
      message: string
      users: User[]
      stats?: {
        visits: number
      }
    }
    'Users/Index': {
      users: User[]
    }
    'Users/Show': {
      user: User
    }
    'Adapter/Form': {
      submitted: Record<string, FormDataConvertible | FormDataConvertible[]> | null
    }
    'Adapter/HeadKeys': Record<string, never>
    'Adapter/InfiniteReverse': {
      manualUsers: PaginatedUsers
      autoUsers: PaginatedUsers
    }
  }
}
