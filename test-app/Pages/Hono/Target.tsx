import { usePage } from '@ts-76/inertia-hono-jsx'

export default function Target() {
  const page = usePage<'Hono/Target'>()

  return <p>{page.props.message}</p>
}
