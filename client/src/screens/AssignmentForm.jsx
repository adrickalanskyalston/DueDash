import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../mock/store'
import BackToDashboard from '../components/BackToDashboard'

const toLocal = (iso) => {
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

// One shared form for both Add and Edit modes (site map: "Add/Edit Assignment").
export default function AssignmentForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, actions } = useStore()

  const existing = id ? data.assignments.find((a) => a.assignment_id === id) : null
  const mode = existing ? 'edit' : 'add'

  const [form, setForm] = useState(() =>
    existing
      ? {
          title: existing.title, course_id: existing.course_id,
          due_at: toLocal(existing.due_at),
          estimated_minutes: String(existing.estimated_minutes),
          estimate_note: existing.estimate_note ?? '',
        }
      : { title: '', course_id: '', due_at: '', estimated_minutes: '', estimate_note: '' }
  )
  const [errors, setErrors] = useState({})

  const submit = async (e) => {
    e.preventDefault()
    const errs = {}
    const minutes = Number(form.estimated_minutes)
    if (!form.title.trim()) errs.title = 'Title is required.'
    if (!form.course_id) errs.course_id = 'Pick a course — assignments must belong to one (BR-01).'
    if (!form.due_at) errs.due_at = 'Due date is required.'
    if (form.estimated_minutes === '' || Number.isNaN(minutes) || minutes < 0)
      errs.estimated_minutes = 'Estimated time must be a number ≥ 0.'
    setErrors(errs)
    if (Object.keys(errs).length) return

    const fields = {
      title: form.title.trim(),
      course_id: form.course_id,
      due_at: new Date(form.due_at).toISOString(),
      estimated_minutes: minutes,
      estimate_note: form.estimate_note.trim() || null,
    }
    try {
      if (mode === 'edit') {
        await actions.updateAssignment(id, fields)
        navigate(`/assignments/${id}`)
      } else {
        const newId = await actions.addAssignment(fields)
        navigate(`/assignments/${newId}`)
      }
    } catch (e) {
      setErrors({ form: `Save failed: ${e.message}` })
    }
  }

  return (
    <main>
      <BackToDashboard />
      <h1>Add/Edit Assignment</h1>
      <p className="muted">{mode === 'edit' ? 'Editing' : 'Adding'} — same shared form for both modes.</p>

      <div className="card">
        <form onSubmit={submit}>
          <label><span>Title *</span>
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            {errors.title && <div className="error">{errors.title}</div>}
          </label>
          <label><span>Course *</span>
            <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
              <option value="">— choose —</option>
              {data.courses.filter((c) => !c.is_archived).map((c) => (
                <option key={c.course_id} value={c.course_id}>{c.course_name} ({c.course_number})</option>
              ))}
            </select>
            {errors.course_id && <div className="error">{errors.course_id}</div>}
          </label>
          <label><span>Due date *</span>
            <input type="datetime-local" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} />
            {errors.due_at && <div className="error">{errors.due_at}</div>}
          </label>
          <label><span>Estimated time (minutes) *</span>
            <input type="number" min="0" value={form.estimated_minutes} onChange={(e) => setForm({ ...form, estimated_minutes: e.target.value })} />
            {errors.estimated_minutes && <div className="error">{errors.estimated_minutes}</div>}
          </label>
          <label><span>Note (optional)</span>
            <textarea rows="2" value={form.estimate_note} onChange={(e) => setForm({ ...form, estimate_note: e.target.value })} placeholder="e.g. why the estimate might be off" />
          </label>
          {errors.form && <div className="error">{errors.form}</div>}
          <button className="primary" type="submit">{mode === 'edit' ? 'Save changes' : 'Add assignment'}</button>
        </form>
      </div>
    </main>
  )
}
