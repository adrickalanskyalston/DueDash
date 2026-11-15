import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../mock/store'
import { displayState, fmtDateTime } from '../mock/data'
import BackToDashboard from '../components/BackToDashboard'
import StatusBadge from '../components/StatusBadge'

export default function AssignmentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data, actions } = useStore()
  const [confirming, setConfirming] = useState(false)
  const [linkMode, setLinkMode] = useState('remove')

  const a = data.assignments.find((x) => x.assignment_id === id)
  if (!a) return <main><BackToDashboard /><p>Assignment not found.</p></main>

  const course = data.courses.find((c) => c.course_id === a.course_id)
  const subs = data.subtasks
    .filter((s) => s.assignment_id === id && !s.deleted_at)
    .sort((x, y) => x.sort_order - y.sort_order)
  const linkedPlanItems = data.planItems.filter(
    (p) => p.assignment_id === id || subs.some((s) => s.subtask_id === p.subtask_id)
  )

  return (
    <main>
      <BackToDashboard />
      <h1>Assignment Detail</h1>

      <div className="card">
        <div className="row">
          <h3 className="grow" style={{ margin: 0 }}>{a.title}</h3>
          <StatusBadge state={displayState(a)} />
        </div>
        <p className="muted">
          {course?.course_name} ({course?.course_number}) · due {fmtDateTime(a.due_at)} ·
          est. {a.estimated_minutes} min
        </p>
        {a.estimate_note && <p className="muted">Note: {a.estimate_note}</p>}
        {a.completed_at && <p className="muted">Completed {fmtDateTime(a.completed_at)}</p>}
        {a.deleted_at && <p className="muted">Soft-deleted — kept for history.</p>}

        <div className="nav-links">
          <button className="small" onClick={() => actions.toggleAssignment(id)}>
            {a.progress_state === 'completed' ? 'Reopen' : 'Mark complete'}
          </button>
          <Link to={`/assignments/${id}/edit`}><button className="small">Edit</button></Link>
          <Link to={`/assignments/${id}/suggestions`}>
            <button className="small">Request subtask suggestions</button>
          </Link>
          {!a.deleted_at && (
            <button className="small danger" onClick={() => setConfirming(true)}>Delete…</button>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Subtasks</h3>
        {subs.length === 0 && <p className="muted">No subtasks yet — request suggestions to break this down.</p>}
        {subs.map((s) => (
          <div className="row" key={s.subtask_id}>
            <input type="checkbox" checked={s.progress_state === 'completed'} onChange={() => actions.toggleSubtask(s.subtask_id)} />
            <span className="grow">{s.title}</span>
            {s.due_at && <span className="muted">due {fmtDateTime(s.due_at)}</span>}
            <span className="muted">{s.estimated_minutes ?? '—'} min</span>
          </div>
        ))}
      </div>

      {confirming && (
        <div className="notice">
          <strong>Delete “{a.title}”?</strong>
          <p className="muted">
            Linked work: {subs.length} subtasks, {linkedPlanItems.length} planned items.
            Choose how to treat them (US-16):
          </p>
          <label>
            <input type="radio" checked={linkMode === 'remove'} onChange={() => setLinkMode('remove')} />
            {' '}Remove its subtasks and planned items too
          </label>
          <label>
            <input type="radio" checked={linkMode === 'keep'} onChange={() => setLinkMode('keep')} />
            {' '}Keep subtasks and plan history (assignment is soft-deleted)
          </label>
          <div className="nav-links">
            <button className="danger" onClick={() => { actions.deleteAssignment(id, linkMode); navigate('/assignments') }}>
              Confirm delete
            </button>
            <button onClick={() => setConfirming(false)}>Cancel</button>
          </div>
        </div>
      )}
    </main>
  )
}
