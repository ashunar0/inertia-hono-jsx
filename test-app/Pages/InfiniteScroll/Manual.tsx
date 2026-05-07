import { InfiniteScroll, usePage } from '@ts-76/inertia-hono-jsx'

export default function Manual() {
  const page = usePage<'InfiniteScroll/Manual'>()

  return (
    <main>
      <h1>Infinite Scroll Manual</h1>
      <InfiniteScroll
        data="users"
        manual
        loading={<span data-testid="infinite-loading">Loading next</span>}
        next={({ fetch, loading, hasMore }) => (
          <button type="button" disabled={loading || !hasMore} onClick={() => fetch()}>
            {loading ? 'Loading next' : hasMore ? 'Fetch next' : 'No more users'}
          </button>
        )}
      >
        <ul data-testid="infinite-users">
          {page.props.users.data.map((user) => (
            <li key={user.id}>{user.name}</li>
          ))}
        </ul>
      </InfiniteScroll>
    </main>
  )
}
