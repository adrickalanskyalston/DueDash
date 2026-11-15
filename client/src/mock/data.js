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
