import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function App() {
  const [dbHealth, setDbHealth] = useState(null)
  const [assignments, setAssignments] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch(`${API_URL}/api/db/health`)
      .then(async (res) => {
        const body = await res.json()
        if (!res.ok) {
          setDbHealth({ status: body.error || `http_${res.status}` })
          return
        }
        setDbHealth(body)
        return fetch(`${API_URL}/api/assignments`)
          .then((r) => (r.ok ? r.json() : []))
          .then(setAssignments)
      })
      .catch(() => setError(`API unreachable at ${API_URL}`))
  }, [])

  return (
    <main>
      <h1>DueDash</h1>
      <p>
        A private student catch-up planner for overdue coursework. Prototype 2 —
        database-backed scaffold; features are not implemented yet.
      </p>

      <h2>API / database status</h2>
      {error && <p>{error}</p>}
      {!error && !dbHealth && <p>Checking…</p>}
      {dbHealth?.status === 'ok' && (
        <p>
          API OK — Supabase reachable ({dbHealth.students} students seeded).
        </p>
      )}
      {dbHealth && dbHealth.status !== 'ok' && (
        <p>
          API OK — Supabase not configured yet (
          <code>{dbHealth.status}</code>). Fill in <code>api/.env</code> after
          running the SQL scripts in <code>db/</code>.
        </p>
      )}

      {assignments.length > 0 && (
        <>
          <h2>Assignments (from database)</h2>
          <ul>
            {assignments.map((a) => (
              <li key={a.assignment_id}>
                <strong>{a.title}</strong> — {a.display_state} — due{' '}
                {new Date(a.due_at).toLocaleDateString()} (
                {a.estimated_minutes} min)
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  )
}

export default App
