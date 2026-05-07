import { usePage } from '@ts-76/inertia-hono-jsx'

export default function UsePage() {
  const page = usePage<{ name: string }>()

  return <p data-testid="page-name">{page.props.name}</p>
}
