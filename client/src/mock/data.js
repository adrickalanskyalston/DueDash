// Shared display/date helpers for the live Prototype 2 frontend.
// (This module held mock seed data at the mock checkpoint; data now comes
// from Express + Supabase via src/mock/store.jsx.)

export const todayStr = () => {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

// BR-04: 'Overdue' is derived by the assignment_display DB view — the client
// shows the server's display_state and only derives locally as a fallback.
export function displayState(a) {
  if (a.display_state) return a.display_state
  if (a.progress_state === 'completed') return 'Completed'
  if (new Date(a.due_at) < new Date()) return 'Overdue'
  if (a.progress_state === 'in_progress') return 'In Progress'
  return 'Not Started'
}

// True when the work was completed but its deadline had already passed —
// counts as "cleared backlog" for the catch-up progress bar.
export const wasOverdue = (a) =>
  a.progress_state === 'completed' && new Date(a.due_at) < new Date()

export const fmtDateTime = (v) =>
  new Date(v).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

export const fmtDate = (v) =>
  new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

export const fmtDay = (dateStr) =>
  new Date((dateStr ?? '').slice(0, 10) + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })

export const fmtTime = (v) =>
  new Date(v).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })

// Expand commitments onto a specific YYYY-MM-DD day, including weekly
// recurrence (recurrence_rule like "FREQ=WEEKLY;BYDAY=TU,TH"). Returns
// [{ commitment, start, end }] with Date-times projected onto that day.
const BYDAY = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 }
export function commitmentsOn(commitments, dayStr) {
  const day = new Date(dayStr + 'T12:00:00')
  const dow = day.getDay()
  const out = []
  for (const c of commitments) {
    const start = new Date(c.starts_at)
    const end = new Date(c.ends_at)
    const byday = /BYDAY=([A-Z,]+)/.exec(c.recurrence_rule ?? '')?.[1]?.split(',')
    if (byday) {
      // Weekly recurrence: matches on day-of-week, starting from starts_at.
      if (!byday.some((b) => BYDAY[b] === dow) || day < new Date(start.toDateString())) continue
      const s = new Date(day); s.setHours(start.getHours(), start.getMinutes(), 0, 0)
      const e = new Date(day); e.setHours(end.getHours(), end.getMinutes(), 0, 0)
      out.push({ ...c, start: s, end: e })
    } else {
      const d0 = (v) => `${v.getFullYear()}-${v.getMonth()}-${v.getDate()}`
      if (d0(start) !== d0(day)) continue
      out.push({ ...c, start, end })
    }
  }
  return out.sort((a, b) => a.start - b.start)
}
