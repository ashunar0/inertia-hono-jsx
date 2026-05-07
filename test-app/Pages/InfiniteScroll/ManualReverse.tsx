import { InfiniteScroll, usePage } from '@ts-76/inertia-hono-jsx'

export default function ManualReverse() {
  const page = usePage<'InfiniteScroll/ManualReverse'>()

  return (
    <main>
      <h1>Infinite Scroll Manual Reverse</h1>
      <InfiniteScroll
        data="users"
        manual
        reverse
        loading={<span data-testid="infinite-reverse-loading">Loading previous</span>}
        previous={({ fetch, loading, hasMore }) =>
          loading ? (
            <span data-testid="infinite-reverse-loading">Loading previous</span>
          ) : (
            <button type="button" disabled={!hasMore} onClick={() => fetch()}>
              {hasMore ? 'Fetch previous' : 'No previous users'}
            </button>
          )
        }
      >
        <ul data-testid="infinite-reverse-users">
          {page.props.users.data.map((user) => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      </InfiniteScroll>
    </main>
  )
}
