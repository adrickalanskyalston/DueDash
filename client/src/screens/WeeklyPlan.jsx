import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useStore } from '../mock/store'
import { commitmentsOn, fmtDate, fmtDay, fmtTime, todayStr } from '../mock/data'
import BackToDashboard from '../components/BackToDashboard'

const WEEK_DAYS = 7
const KIND_LABEL = { class: 'Class', work: 'Work', personal: 'Personal' }

export default function WeeklyPlan() {
  const { data, actions } = useStore()
  const [newWeek, setNewWeek] = useState('')
  const [add, setAdd] = useState({ target: '', planned_date: todayStr(), planned_minutes: 30 })
  const [editing, setEditing] = useState(null) // {id, planned_date, planned_minutes}
  const [notice, setNotice] = useState(null)

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
      .sort((a, b) => (a.planned_minutes ?? 0) - (b.planned_minutes ?? 0))

  const totalPlanned = data.planItems
    .filter((p) => p.weekly_plan_id === current?.weekly_plan_id)
    .reduce((n, p) => n + p.planned_minutes, 0)

  // Unfinished work the student can plan manually.
  const unfinished = [
    ...data.assignments.filter((a) => a.progress_state !== 'completed')
      .map((a) => ({ key: `a:${a.assignment_id}`, label: a.title })),
    ...data.subtasks.filter((s) => s.progress_state !== 'completed')
      .map((s) => ({ key: `s:${s.subtask_id}`, label: `${s.title} (subtask)` })),
  ]

  const run = (fn) => async () => {
    try { await fn(); setNotice(null) } catch (e) { setNotice(e.message) }
  }

  return (
    <main>
      <BackToDashboard />
      <h1>Weekly Plan</h1>
      <p className="muted">
        Week of {current ? fmtDay(current.week_start) : '—'} — deadlines, estimates, and your
        availability drive the plan. Study sessions are <strong>not</strong> auto-booked (BR-07).
      </p>
      {notice && <div className="error">{notice}</div>}

      <div className="card">
        <h3>Plans</h3>
        <div className="row">
          <input type="date" value={newWeek} onChange={(e) => setNewWeek(e.target.value)} />
          <button
            className="small" disabled={!newWeek}
            onClick={run(() => actions.createPlan(newWeek))}
          >
            Start plan for this week
          </button>
          <span className="muted">Starting a new plan archives the current one — history is kept (BR-10).</span>
        </div>
      </div>

      {current && (
        <div className="card">
          <h3>Current plan — {totalPlanned} min planned</h3>
          {days.map((day) => {
            const busy = commitmentsOn(data.commitments, day)
            const items = itemsOn(current.weekly_plan_id, day)
            return (
              <div key={day} style={{ marginTop: '0.5rem' }}>
                <strong>{fmtDay(day)}</strong>
                {busy.map((c) => (
                  <div className="row" key={`${day}-${c.commitment_id}`}>
                    <span className="badge busy">{KIND_LABEL[c.kind] ?? c.kind} · busy</span>
                    <span className="grow">{c.title}</span>
                    <span className="muted">{fmtTime(c.start)}–{fmtTime(c.end)}{c.recurrence_rule ? ' ↻' : ''}</span>
                  </div>
                ))}
                {items.map((p) =>
                  editing?.id === p.plan_item_id ? (
                    <div className="row" key={p.plan_item_id}>
                      <span className="grow">{workTitle(p)}</span>
                      <input type="date" value={editing.planned_date}
                        onChange={(e) => setEditing({ ...editing, planned_date: e.target.value })} />
                      <input type="number" min="0" style={{ width: 70 }} value={editing.planned_minutes}
                        onChange={(e) => setEditing({ ...editing, planned_minutes: e.target.value })} /> min
                      <button className="small"
                        onClick={run(async () => {
                          await actions.updatePlanItem(p.plan_item_id, {
                            planned_date: editing.planned_date,
                            planned_minutes: Number(editing.planned_minutes),
                          })
                          setEditing(null)
                        })}>Save</button>
                      <button className="small" onClick={() => setEditing(null)}>Cancel</button>
                    </div>
                  ) : (
                    <div className="row" key={p.plan_item_id}>
                      <span className="grow">{workTitle(p)}</span>
                      <span className="muted">{p.planned_minutes} min</span>
                      <button className="small" onClick={() =>
                        setEditing({ id: p.plan_item_id, planned_date: p.planned_date, planned_minutes: p.planned_minutes })
                      }>Edit</button>
                      <button className="small"
                        onClick={run(() => actions.removePlanItem(p.plan_item_id))}>Remove</button>
                    </div>
                  ),
                )}
                {!busy.length && !items.length && <div className="muted">— free</div>}
              </div>
            )
          })}
          <div className="nav-links">
            <Link to="/plan/checklist">Open Daily Checklist →</Link>
          </div>
        </div>
      )}

      {current && (
        <div className="card">
          <h3>Add work manually</h3>
          <div className="row">
            <select value={add.target} onChange={(e) => setAdd({ ...add, target: e.target.value })}>
              <option value="">— choose assignment or subtask —</option>
              {unfinished.map((u) => <option key={u.key} value={u.key}>{u.label}</option>)}
            </select>
            <input type="date" value={add.planned_date}
              onChange={(e) => setAdd({ ...add, planned_date: e.target.value })} />
            <input type="number" min="0" style={{ width: 70 }} value={add.planned_minutes}
              onChange={(e) => setAdd({ ...add, planned_minutes: e.target.value })} /> min
            <button className="small" disabled={!add.target}
              onClick={run(() => actions.addPlanItem({
                weekly_plan_id: current.weekly_plan_id,
                assignment_id: add.target.startsWith('a:') ? add.target.slice(2) : null,
                subtask_id: add.target.startsWith('s:') ? add.target.slice(2) : null,
                planned_date: add.planned_date,
                planned_minutes: Number(add.planned_minutes),
              }))}>Add to plan</button>
          </div>
        </div>
      )}

      <div className="card">
        <h3>Suggested additions (draft — approve or decline)</h3>
        {data.planSuggestions.length === 0 && <p className="muted">No pending suggestions.</p>}
        {data.planSuggestions.map((s) => (
          <div className="row" key={s.id}>
            <span className="grow">{suggestionTitle(s)}</span>
            <span className="muted">{fmtDay(s.planned_date)} · {s.planned_minutes} min</span>
            <button className="small" onClick={run(() => actions.approveSuggestion(s.id))}>Approve</button>
            <button className="small" onClick={run(() => actions.declineSuggestion(s.id))}>Decline</button>
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
