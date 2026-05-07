import type { Page, SharedPageProps } from '@inertiajs/core'
import { useContext } from 'hono/jsx'
import PageContext from './PageContext'
import type { PageName, PagePropsFor } from './types'

export default function usePage<Name extends PageName = PageName>(): Page<PagePropsFor<Name> & SharedPageProps> {
  const page = useContext(PageContext)

  if (!page) {
    throw new Error('usePage must be used within the Inertia component')
  }

  return page as Page<PagePropsFor<Name> & SharedPageProps>
}
