import { Head, Link, type PageComponent } from '@ts-76/inertia-hono-jsx'
import { useState } from 'hono/jsx'
import { AppLayout } from '../../components/AppLayout'
import { PageShell } from '../../components/PageShell'
import type { Child } from 'hono/jsx/dom'

const UsersShow: PageComponent<'Users/Show'> = (props) => {
  const [notes, setNotes] = useState('')

  return (
    <PageShell>
      <Head title={`User: ${props.user.name}`} />
      <h1>{props.user.name}</h1>
      <p>{props.user.role}</p>

      <label>
        Local note for this page
        <textarea
          value={notes}
          placeholder={`Write a note about ${props.user.name}`}
          onInput={(event) => setNotes((event.currentTarget as HTMLTextAreaElement).value)}
        />
      </label>

      <p>Note length: {notes.length}</p>

      <nav>
        <Link href="/users" preserveState>
          Back to users
        </Link>
        <Link href="/">Home</Link>
      </nav>
    </PageShell>
  )
}

UsersShow.layout = (page: Child) => <AppLayout section="User detail">{page}</AppLayout>

export default UsersShow
