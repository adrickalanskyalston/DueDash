import { useStore } from '../mock/store'
import { todayStr } from '../mock/data'
import BackToDashboard from '../components/BackToDashboard'

export default function DailyChecklist() {
  const { data, actions } = useStore()

  const today = todayStr()
  const currentPlan = data.weeklyPlans.find((w) => w.plan_state === 'current')
  const items = data.planItems
    .filter((p) => p.weekly_plan_id === currentPlan?.weekly_plan_id && p.planned_date === today)
    .sort((a, b) => a.sort_order - b.sort_order)

  const target = (p) =>
    p.subtask_id
      ? data.subtasks.find((s) => s.subtask_id === p.subtask_id)
      : data.assignments.find((a) => a.assignment_id === p.assignment_id)

  const total = items.reduce((n, p) => n + p.planned_minutes, 0)

  return (
    <main>
      <BackToDashboard />
      <h1>Daily Checklist</h1>
      <p className="muted">Today only · {items.length} items · ~{total} min planned</p>

      <div className="card">
        {items.length === 0 && <p className="muted">Nothing planned for today.</p>}
        {items.map((p) => {
          const t = target(p)
          const done = t?.progress_state === 'completed'
          return (
            <div className="row" key={p.plan_item_id}>
              <input
                type="checkbox" checked={!!done}
                onChange={() =>
                  p.subtask_id ? actions.toggleSubtask(p.subtask_id) : actions.toggleAssignment(p.assignment_id)
                }
              />
              <span className="grow" style={done ? { textDecoration: 'line-through' } : undefined}>
                {t?.title ?? '(removed)'}
              </span>
              <span className="muted">{p.planned_minutes} min</span>
            </div>
          )
        })}
      </div>
      <p className="muted">Check items off as you finish — progress updates everywhere.</p>
    </main>
  )
}
