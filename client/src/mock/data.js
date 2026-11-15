// Fictional mock data for Prototype 2 — mirrors db/02_seed.sql shape.
// All interactions stay local; nothing calls the live API in this phase.

const DAY = 864e5

export const todayStr = () => {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
}

const iso = (daysFromNow, hourOffset = 0) =>
  new Date(Date.now() + daysFromNow * DAY + hourOffset * 36e5).toISOString()

const mondayOf = (weeksAgo = 0) => {
  const n = new Date()
  const back = (n.getDay() + 6) % 7 // days since Monday
  const d = new Date(n.getFullYear(), n.getMonth(), n.getDate() - back - weeksAgo * 7)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const addDays = (dateStr, n) => {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Local time on a day n days from now, e.g. atTime(2, '17:00').
const atTime = (daysFromNow, hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + daysFromNow, h, m).toISOString()
}

export function buildSeedData() {
  return {
    student: {
      student_id: 's-01',
      display_name: 'Jordan Lee',
      time_zone: 'America/Chicago',
    },
    courses: [
      {
        course_id: 'c-11', course_name: 'Business Statistics', course_number: 'BUS 210',
        semester: 'Fall 2026', instructor_name: 'Dr. Priya Nair',
        instructor_email: 'pnair@example.edu', office_hours: 'Tue 14:00-15:30',
        is_archived: false, archived_at: null,
      },
      {
        course_id: 'c-12', course_name: 'Intro to MIS', course_number: 'MIS 101',
        semester: 'Spring 2026', instructor_name: 'Prof. Alan Grant',
        instructor_email: null, office_hours: null,
        is_archived: true, archived_at: iso(-30),
      },
      {
        course_id: 'c-13', course_name: 'Marketing Analytics', course_number: 'MKT 410',
        semester: 'Fall 2026', instructor_name: 'Dr. Lena Ortiz',
        instructor_email: 'lortiz@example.edu', office_hours: 'Wed 10:00-11:00',
        is_archived: false, archived_at: null,
      },
    ],
    assignments: [
      {
        assignment_id: 'a-21', course_id: 'c-11', title: 'Regression problem set',
        due_at: iso(-3), estimated_minutes: 240,
        estimate_note: 'Harder than expected; revisit lecture 9',
        progress_state: 'in_progress', completed_at: null, deleted_at: null,
      },
      {
        assignment_id: 'a-22', course_id: 'c-12', title: 'Systems analysis report',
        due_at: iso(-40), estimated_minutes: 180, estimate_note: null,
        progress_state: 'completed', completed_at: iso(-35), deleted_at: null,
      },
      {
        assignment_id: 'a-23', course_id: 'c-11', title: 'Chapter 7 quiz prep',
        due_at: iso(4), estimated_minutes: 60, estimate_note: null,
        progress_state: 'not_started', completed_at: null, deleted_at: null,
      },
      {
        assignment_id: 'a-24', course_id: 'c-13', title: 'Market research paper',
        due_at: iso(10), estimated_minutes: 300,
        estimate_note: 'Estimate assumes survey data arrives on time',
        progress_state: 'in_progress', completed_at: null, deleted_at: null,
      },
      {
        assignment_id: 'a-25', course_id: 'c-13', title: 'Reading: consumer behavior',
        due_at: iso(-1), estimated_minutes: 45, estimate_note: null,
        progress_state: 'not_started', completed_at: null, deleted_at: iso(-0.5),
      },
    ],
    subtasks: [
      { subtask_id: 'st-31', assignment_id: 'a-24', title: 'Outline paper sections', due_at: null, estimated_minutes: 30, progress_state: 'completed', sort_order: 1, completed_at: iso(-5) },
      { subtask_id: 'st-32', assignment_id: 'a-24', title: 'Collect survey data', due_at: iso(3), estimated_minutes: 120, progress_state: 'in_progress', sort_order: 2, completed_at: null },
      { subtask_id: 'st-33', assignment_id: 'a-24', title: 'Draft findings section', due_at: iso(7), estimated_minutes: 90, progress_state: 'not_started', sort_order: 3, completed_at: null },
      { subtask_id: 'st-34', assignment_id: 'a-24', title: 'Edit and finalize', due_at: null, estimated_minutes: 45, progress_state: 'not_started', sort_order: 4, completed_at: null },
      { subtask_id: 'st-35', assignment_id: 'a-21', title: 'Review lecture notes', due_at: null, estimated_minutes: 30, progress_state: 'not_started', sort_order: 1, completed_at: null },
    ],
    commitments: [
      { commitment_id: 'cm-41', kind: 'work', title: 'Bookstore shift', starts_at: atTime(2, '17:00'), ends_at: atTime(2, '21:00'), recurrence_rule: 'FREQ=WEEKLY;BYDAY=TU,TH' },
      { commitment_id: 'cm-42', kind: 'class', title: 'BUS 210 lecture', starts_at: atTime(3, '10:00'), ends_at: atTime(3, '11:15'), recurrence_rule: 'FREQ=WEEKLY;BYDAY=MO,WE' },
      { commitment_id: 'cm-43', kind: 'personal', title: 'Marketing club meeting', starts_at: atTime(5, '18:00'), ends_at: atTime(5, '20:00'), recurrence_rule: 'FREQ=WEEKLY;BYDAY=FR' },
      { commitment_id: 'cm-44', kind: 'personal', title: 'Dentist appointment', starts_at: atTime(6, '09:00'), ends_at: atTime(6, '10:00'), recurrence_rule: null },
    ],
    weeklyPlans: [
      { weekly_plan_id: 'w-51', week_start: mondayOf(1), plan_state: 'archived', created_at: iso(-8), archived_at: iso(-1) },
      { weekly_plan_id: 'w-52', week_start: mondayOf(0), plan_state: 'current', created_at: iso(-1), archived_at: null },
    ],
    planItems: [
      // Missed prior-week item → feeds the missed-plan alert.
      { plan_item_id: 'pi-61', weekly_plan_id: 'w-51', assignment_id: 'a-21', subtask_id: null, planned_date: addDays(mondayOf(1), 1), planned_minutes: 120, sort_order: 1 },
      { plan_item_id: 'pi-62', weekly_plan_id: 'w-51', assignment_id: null, subtask_id: 'st-31', planned_date: addDays(mondayOf(1), 2), planned_minutes: 45, sort_order: 2 },
      { plan_item_id: 'pi-63', weekly_plan_id: 'w-52', assignment_id: 'a-23', subtask_id: null, planned_date: todayStr(), planned_minutes: 90, sort_order: 1 },
      { plan_item_id: 'pi-64', weekly_plan_id: 'w-52', assignment_id: null, subtask_id: 'st-35', planned_date: todayStr(), planned_minutes: 60, sort_order: 2 },
      { plan_item_id: 'pi-65', weekly_plan_id: 'w-52', assignment_id: 'a-24', subtask_id: null, planned_date: addDays(mondayOf(0), 3), planned_minutes: 150, sort_order: 3 },
    ],
    // Draft suggestions: stay uncommitted until the student approves (US-06).
    planSuggestions: [
      { id: 'ps-1', assignment_id: 'a-23', subtask_id: null, planned_date: addDays(todayStr(), 1), planned_minutes: 60 },
      { id: 'ps-2', assignment_id: null, subtask_id: 'st-33', planned_date: addDays(todayStr(), 2), planned_minutes: 90 },
    ],
    alerts: [
      { alert_id: 'al-71', assignment_id: 'a-23', plan_item_id: null, alert_type: 'due_soon', created_at: iso(-0.25), alert_state: 'unread' },
      { alert_id: 'al-72', assignment_id: 'a-21', plan_item_id: null, alert_type: 'overdue', created_at: iso(-1), alert_state: 'unread' },
      { alert_id: 'al-73', assignment_id: 'a-21', plan_item_id: 'pi-61', alert_type: 'missed_plan', created_at: iso(-2), alert_state: 'unread' },
      { alert_id: 'al-74', assignment_id: 'a-24', plan_item_id: null, alert_type: 'due_soon', created_at: iso(-2), alert_state: 'read' },
      { alert_id: 'al-75', assignment_id: 'a-21', plan_item_id: null, alert_type: 'overdue', created_at: iso(-3), alert_state: 'dismissed' },
    ],
  }
}

// ----- shared helpers (mock reimplementation of the DB rules) -----

// BR-04: 'Overdue' is derived, never stored.
export function displayState(a) {
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
  new Date(dateStr + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
