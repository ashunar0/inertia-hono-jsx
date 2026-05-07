import { Head, Link, WhenVisible, usePoll, type PageComponent } from '@ts-76/inertia-hono-jsx'
import { useMemo, useState } from 'hono/jsx'
import { AppLayout } from '../../components/AppLayout'
import { PageShell } from '../../components/PageShell'
import type { Child } from 'hono/jsx/dom'

const UsersIndex: PageComponent<'Users/Index'> = (props) => {
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc')
  const poll = usePoll(30000, {}, { autoStart: false })

  const sortedUsers = useMemo(() => {
    return [...props.users].sort((first, second) => {
      const result = first.name.localeCompare(second.name)
      return direction === 'asc' ? result : -result
    })
  }, [direction, props.users])

  return (
    <PageShell>
      <Head title="Hono JSX Users" />
      <h1>Users</h1>

      <nav>
        <Link href="/" preserveState>
          Home
        </Link>
      </nav>

      <button type="button" onClick={() => setDirection((current) => (current === 'asc' ? 'desc' : 'asc'))}>
        Sort {direction === 'asc' ? 'descending' : 'ascending'}
      </button>
      <button type="button" onClick={() => poll.start()}>
        Start poll
      </button>
      <button type="button" onClick={() => poll.stop()}>
        Stop poll
      </button>

      <ul>
        {sortedUsers.map((user) => (
          <li key={user.id}>
            <Link href={`/users/${user.id}`} preserveState>
              {user.name} - {user.role}
            </Link>
          </li>
        ))}
      </ul>

      <WhenVisible data="users" fallback={<p>Waiting for users section.</p>} always>
        {({ fetching }: { fetching: boolean }) => <p>Visible reload fetching: {fetching ? 'yes' : 'no'}</p>}
      </WhenVisible>
    </PageShell>
  )
}

UsersIndex.layout = (page: Child) => <AppLayout section="Users">{page}</AppLayout>

export default UsersIndex
