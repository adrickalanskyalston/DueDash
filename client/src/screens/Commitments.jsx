import { useState } from 'react'
import { useStore } from '../mock/store'
import { fmtDateTime } from '../mock/data'
import BackToDashboard from '../components/BackToDashboard'

const KINDS = ['class', 'work', 'personal']
const RECUR = [
  ['', 'Does not repeat'],
  ['FREQ=WEEKLY;BYDAY=MO,WE', 'Weekly — Mon & Wed'],
  ['FREQ=WEEKLY;BYDAY=TU,TH', 'Weekly — Tue & Thu'],
  ['FREQ=WEEKLY;BYDAY=FR', 'Weekly — Friday'],
]

export default function Commitments() {
  const { data, actions } = useStore()
  const [form, setForm] = useState({ kind: 'work', title: '', starts_at: '', ends_at: '', recurrence_rule: '' })
  const [error, setError] = useState(null)

  const submit = (e) => {
    e.preventDefault()
    const start = new Date(form.starts_at)
    const end = new Date(form.ends_at)
    if (!form.title.trim()) return setError('Title is required.')
    if (!form.starts_at || !form.ends_at) return setError('Start and end times are required.')
    // Spec rule: end must be later than start.
    if (!(end > start)) return setError('End time must be after the start time.')
    actions.addCommitment({
      kind: form.kind, title: form.title.trim(),
      starts_at: start.toISOString(), ends_at: end.toISOString(),
      recurrence_rule: form.recurrence_rule || null,
    })
    setForm({ kind: 'work', title: '', starts_at: '', ends_at: '', recurrence_rule: '' })
    setError(null)
  }

  return (
    <main>
      <BackToDashboard />
      <h1>Commitments</h1>
      <p className="muted">Busy blocks only — DueDash never auto-books study sessions (US-05/US-15).</p>

      {KINDS.map((kind) => (
        <div className="card" key={kind}>
          <h3>{kind[0].toUpperCase() + kind.slice(1)}</h3>
          {data.commitments.filter((c) => c.kind === kind).map((c) => (
            <div className="row" key={c.commitment_id}>
              <span className="grow">{c.title}</span>
              <span className="muted">{fmtDateTime(c.starts_at)} → {fmtDateTime(c.ends_at)}</span>
              {c.recurrence_rule && <span className="badge">repeats</span>}
            </div>
          ))}
          {data.commitments.filter((c) => c.kind === kind).length === 0 && (
            <p className="muted">None recorded.</p>
          )}
        </div>
      ))}

      <div className="card">
        <h3>Add / edit a commitment</h3>
        <form onSubmit={submit}>
          <label><span>Kind</span>
            <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              {KINDS.map((k) => <option key={k} value={k}>{k}</option>)}
            </select>
          </label>
          <label><span>Title *</span>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Bookstore shift" />
          </label>
          <label><span>Starts *</span>
            <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
          </label>
          <label><span>Ends *</span>
            <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
          </label>
          <label><span>Repeats</span>
            <select value={form.recurrence_rule} onChange={(e) => setForm({ ...form, recurrence_rule: e.target.value })}>
              {RECUR.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
            </select>
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary" type="submit">Save commitment</button>
        </form>
      </div>
    </main>
  )
}
