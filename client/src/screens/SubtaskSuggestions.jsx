import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../mock/store'
import BackToDashboard from '../components/BackToDashboard'

// US-04/US-13: reached only via "Request subtask suggestions" on the detail
// screen. Suggestions are editable drafts — accept keeps them, decline drops.
// Mechanism is template-based; no generation method is approved yet.
const TEMPLATE = [
  { title: 'Outline / gather materials', estimated_minutes: 20, due_at: '' },
  { title: 'Complete first working draft', estimated_minutes: 60, due_at: '' },
  { title: 'Review and revise', estimated_minutes: 30, due_at: '' },
]

export default function SubtaskSuggestions() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, actions } = useStore()

  const a = data.assignments.find((x) => x.assignment_id === id)
  const [steps, setSteps] = useState(TEMPLATE)
  const [declined, setDeclined] = useState(false)

  if (!a) return <main><BackToDashboard /><p>Assignment not found.</p></main>

  const setStep = (i, patch) =>
    setSteps((s) => s.map((x, j) => (j === i ? { ...x, ...patch } : x)))

  const accept = () => {
    const kept = steps.filter((s) => s.title.trim())
    if (kept.length) {
      actions.addSubtasks(id, kept.map((s) => ({
        title: s.title.trim(),
        estimated_minutes: s.estimated_minutes === '' ? null : Number(s.estimated_minutes),
        due_at: s.due_at ? new Date(s.due_at).toISOString() : null,
      })))
    }
    navigate(`/assignments/${id}`)
  }

  const decline = () => { setDeclined(true); setTimeout(() => navigate(`/assignments/${id}`), 600) }

  return (
    <main>
      <BackToDashboard />
      <h1>Subtask Suggestions</h1>
      <p className="muted">
        Requested for “{a.title}”. Template-based drafts — edit titles,
        estimates, and optional due dates, then accept or decline (US-14).
      </p>

      <div className="card">
        {declined && <p className="muted">Declined — nothing was added.</p>}
        {!declined && steps.map((s, i) => (
          <div className="row" key={i}>
            <input style={{ flex: 2 }} value={s.title} onChange={(e) => setStep(i, { title: e.target.value })} />
            <input style={{ width: '5rem' }} type="number" min="0" value={s.estimated_minutes}
              onChange={(e) => setStep(i, { estimated_minutes: e.target.value })} placeholder="min" />
            <input style={{ width: '11rem' }} type="datetime-local" value={s.due_at}
              onChange={(e) => setStep(i, { due_at: e.target.value })} title="optional due date" />
          </div>
        ))}
        {!declined && (
          <div className="nav-links">
            <button className="primary" onClick={accept}>Accept — add these steps</button>
            <button onClick={decline}>Decline all</button>
          </div>
        )}
      </div>
      <p className="muted">Declined suggestions add nothing; accepted steps become editable subtasks.</p>
    </main>
  )
}
