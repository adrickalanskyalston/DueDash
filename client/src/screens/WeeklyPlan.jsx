import { Link } from 'react-router-dom'
import { useStore } from '../mock/store'
import { fmtDate, fmtDay } from '../mock/data'
import BackToDashboard from '../components/BackToDashboard'

const WEEK_DAYS = 7

export default function WeeklyPlan() {
  const { data, actions } = useStore()

  const workTitle = (p) => {
    if (p.assignment_id) return data.assignments.find((a) => a.assignment_id === p.assignment_id)?.title ?? '(removed)'
    const s = data.subtasks.find((x) => x.subtask_id === p.subtask_id)
    const a = data.assignments.find((x) => x.assignment_id === s?.assignment_id)
    return s ? `${s.title} (${a?.title ?? '?'})` : '(removed)'
  }
  const suggestionTitle = (s) =>
    s.assignment_id
      ? data.assignments.find((a) => a.assignment_id === s.assignment_id)?.title
      : data.subtasks.find((x) => x.subtask_id === s.subtask_id)?.title

  const current = data.weeklyPlans.find((w) => w.plan_state === 'current')
  const past = data.weeklyPlans.filter((w) => w.plan_state === 'archived')

  const days = current
    ? Array.from({ length: WEEK_DAYS }, (_, i) => {
        const d = new Date(current.week_start + 'T12:00:00')
        d.setDate(d.getDate() + i)
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      })
    : []

  const itemsOn = (planId, day) =>
    data.planItems
      .filter((p) => p.weekly_plan_id === planId && p.planned_date === day)
      .sort((a, b) => a.sort_order - b.sort_order)

  const freeDays = data.commitments.length // presence of busy blocks
  const totalPlanned = data.planItems
    .filter((p) => p.weekly_plan_id === current?.weekly_plan_id)
    .reduce((n, p) => n + p.planned_minutes, 0)

  return (
    <main>
      <BackToDashboard />
      <h1>Weekly Plan</h1>
      <p className="muted">
        Week of {current && fmtDay(current.week_start)} — deadlines, estimates, and your
        availability drive the plan. Study sessions are <strong>not</strong> auto-booked (BR-07).
      </p>

      <div className="card">
        <h3>Current plan — {totalPlanned} min planned · {freeDays} busy blocks on record</h3>
        {days.map((day) => (
          <div key={day} style={{ marginTop: '0.5rem' }}>
            <strong>{fmtDay(day)}</strong>
            {itemsOn(current.weekly_plan_id, day).map((p) => (
              <div className="row" key={p.plan_item_id}>
                <span className="grow">{workTitle(p)}</span>
                <span className="muted">{p.planned_minutes} min</span>
              </div>
            ))}
            {itemsOn(current.weekly_plan_id, day).length === 0 && (
              <div className="muted">— free</div>
            )}
          </div>
        ))}
        <div className="nav-links">
          <Link to="/plan/checklist">Open Daily Checklist →</Link>
        </div>
      </div>

      <div className="card">
        <h3>Suggested additions (draft — approve or decline)</h3>
        {data.planSuggestions.length === 0 && <p className="muted">No pending suggestions.</p>}
        {data.planSuggestions.map((s) => (
          <div className="row" key={s.id}>
            <span className="grow">{suggestionTitle(s)}</span>
            <span className="muted">{fmtDay(s.planned_date)} · {s.planned_minutes} min</span>
            <button className="small" onClick={() => actions.approveSuggestion(s.id)}>Approve</button>
            <button className="small" onClick={() => actions.declineSuggestion(s.id)}>Decline</button>
          </div>
        ))}
      </div>

      {past.length > 0 && (
        <div className="card">
          <h3>Past plans (history kept)</h3>
          {past.map((w) => (
            <div key={w.weekly_plan_id}>
              <strong>Week of {fmtDay(w.week_start)}</strong>{' '}
              <span className="muted">archived {fmtDate(w.archived_at)}</span>
              {data.planItems
                .filter((p) => p.weekly_plan_id === w.weekly_plan_id)
                .map((p) => (
                  <div className="row" key={p.plan_item_id}>
                    <span className="grow">{workTitle(p)}</span>
                    <span className="muted">{fmtDay(p.planned_date)} · {p.planned_minutes} min</span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
