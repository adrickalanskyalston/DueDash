import { Link } from 'react-router-dom'
import { useStore } from '../mock/store'
import { displayState, fmtDate, todayStr, wasOverdue } from '../mock/data'
import StatusBadge from '../components/StatusBadge'

export default function Dashboard() {
  const { data, actions } = useStore()

  const active = data.assignments.filter((a) => !a.deleted_at)
  const incomplete = active.filter((a) => a.progress_state !== 'completed')
  const overdue = incomplete.filter((a) => displayState(a) === 'Overdue')
  const upcoming = incomplete
    .filter((a) => displayState(a) !== 'Overdue')
    .sort((x, y) => new Date(x.due_at) - new Date(y.due_at))
  const completedTotal = data.assignments.filter(wasOverdue).length
  const clearedPct = Math.round((completedTotal / Math.max(1, completedTotal + overdue.length)) * 100)

  const workTitle = (p) => {
    if (p.assignment_id) return data.assignments.find((a) => a.assignment_id === p.assignment_id)?.title ?? '(removed)'
    const s = data.subtasks.find((x) => x.subtask_id === p.subtask_id)
    const a = data.assignments.find((x) => x.assignment_id === s?.assignment_id)
    return s ? `${s.title} (${a?.title ?? '?'})` : '(removed)'
  }

  const today = todayStr()
  const currentPlan = data.weeklyPlans.find((w) => w.plan_state === 'current')
  const todaysItems = data.planItems
    .filter((p) => p.weekly_plan_id === currentPlan?.weekly_plan_id && p.planned_date === today)
    .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <main>
      <h1>Dashboard</h1>
      <p className="muted">Welcome back, {data.student.display_name}. Catch up first — everything starts here.</p>

      <nav className="nav-links">
        <Link to="/assignments">Assignment List</Link>
        <Link to="/courses">Courses</Link>
        <Link to="/plan">Weekly Plan</Link>
        <Link to="/commitments">Commitments</Link>
        <Link to="/reminders">Reminders</Link>
      </nav>

      <div className="card">
        <h3>Catch-up progress</h3>
        <div className="progress-track">
          <div className="progress-fill" style={{ width: `${clearedPct}%` }} />
        </div>
        <p className="muted">
          {completedTotal} overdue cleared · {overdue.length} remaining ({clearedPct}%)
        </p>
      </div>

      <div className="card">
        <h3>Today's work</h3>
        {todaysItems.length === 0 && <p className="muted">Nothing planned for today.</p>}
        {todaysItems.map((p) => {
          const targetDone = p.subtask_id
            ? data.subtasks.find((s) => s.subtask_id === p.subtask_id)?.progress_state === 'completed'
            : data.assignments.find((a) => a.assignment_id === p.assignment_id)?.progress_state === 'completed'
          return (
            <div className="row" key={p.plan_item_id}>
              <input
                type="checkbox" checked={!!targetDone}
                onChange={() =>
                  p.subtask_id ? actions.toggleSubtask(p.subtask_id) : actions.toggleAssignment(p.assignment_id)
                }
              />
              <span className="grow">{workTitle(p)}</span>
              <span className="muted">{p.planned_minutes} min</span>
            </div>
          )
        })}
      </div>

      <div className="card">
        <h3>Overdue</h3>
        {overdue.length === 0 && <p className="muted">Nothing overdue. Nice.</p>}
        {overdue.map((a) => (
          <div className="row" key={a.assignment_id}>
            <span className="grow"><Link to={`/assignments/${a.assignment_id}`}>{a.title}</Link></span>
            <span className="muted">due {fmtDate(a.due_at)}</span>
            <StatusBadge state="Overdue" />
          </div>
        ))}
      </div>

      <div className="card">
        <h3>Upcoming deadlines</h3>
        {upcoming.map((a) => (
          <div className="row" key={a.assignment_id}>
            <span className="grow"><Link to={`/assignments/${a.assignment_id}`}>{a.title}</Link></span>
            <span className="muted">due {fmtDate(a.due_at)}</span>
            <StatusBadge state={displayState(a)} />
          </div>
        ))}
      </div>

      <Link to="/assignments/new"><button className="primary">+ Add Assignment</button></Link>
    </main>
  )
}
