import { usePage } from '@ts-76/inertia-hono-jsx'

export default function Target() {
  const page = usePage<{ message: string }>()

  return <p>{page.props.message}</p>
}
