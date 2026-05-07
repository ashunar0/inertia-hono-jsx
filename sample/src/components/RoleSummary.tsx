import { useMemo } from 'hono/jsx'
import type { PagePropsFor } from '@ts-76/inertia-hono-jsx'

type Users = PagePropsFor<'Home'>['users']

export function RoleSummary({ users }: { users: Users }) {
  const summary = useMemo(() => {
    return users.reduce<Record<string, number>>((counts, user) => {
      counts[user.role] = (counts[user.role] ?? 0) + 1
      return counts
    }, {})
  }, [users])

  return (
    <section>
      <h2>Memoized role summary</h2>
      <dl>
        {Object.entries(summary).map(([role, count]) => (
          <div key={role}>
            <dt>{role}</dt>
            <dd>{count}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
