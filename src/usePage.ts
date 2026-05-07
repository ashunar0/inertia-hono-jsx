import type { Page, PageProps, SharedPageProps } from '@inertiajs/core'
import { useContext } from 'hono/jsx'
import PageContext from './PageContext'
import type { PageName, PagePropsFor } from './types'

export default function usePage<TPageProps extends PageProps = PageProps>(): Page<TPageProps & SharedPageProps> {
  const page = useContext(PageContext)

  if (!page) {
    throw new Error('usePage must be used within the Inertia component')
  }

  return page as Page<TPageProps & SharedPageProps>
}

export function useTypedPage<Name extends PageName>(): Page<PagePropsFor<Name> & SharedPageProps> {
  return usePage<PagePropsFor<Name> & SharedPageProps>()
}
