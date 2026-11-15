import { useStore } from '../mock/store'
import { fmtDateTime } from '../mock/data'
import BackToDashboard from '../components/BackToDashboard'

const GROUPS = [
  ['due_soon', 'Upcoming deadlines'],
  ['overdue', 'Overdue work'],
  ['missed_plan', 'Missed planned tasks'],
]

export default function Reminders() {
  const { data, actions } = useStore()

  const titleOf = (a) => data.assignments.find((x) => x.assignment_id === a.assignment_id)?.title ?? '(none)'

  return (
    <main>
      <BackToDashboard />
      <h1>Reminders</h1>
      <p className="muted">Approaching deadlines, overdue work, and missed planned tasks (US-11/US-18).</p>

      {GROUPS.map(([type, label]) => {
        const items = data.alerts.filter((a) => a.alert_type === type)
        return (
          <div className="card" key={type}>
            <h3>{label}</h3>
            {items.length === 0 && <p className="muted">None.</p>}
            {items.map((a) => (
              <div className="row" key={a.alert_id}>
                <span className="grow">{titleOf(a)}</span>
                <span className="muted">{fmtDateTime(a.created_at)}</span>
                <span className={`badge ${a.alert_state === 'unread' ? 'overdue' : 'completed'}`}>{a.alert_state}</span>
                {a.alert_state === 'unread' && (
                  <>
                    <button className="small" onClick={() => actions.resolveAlert(a.alert_id, 'read')}>Mark read</button>
                    <button className="small" onClick={() => actions.resolveAlert(a.alert_id, 'dismissed')}>Dismiss</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )
      })}

      <div className="notice">
        <strong>Reminder settings</strong>
        <p className="muted">
          Delivery channel: <strong>TBD</strong> — in-app reminders only for this demo
          (email/push not confirmed). Timing and dismissal policy still open;
          missed-plan alerts are tracked separately from due-soon alerts (BR-11).
        </p>
      </div>
    </main>
  )
}
