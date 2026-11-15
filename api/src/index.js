import cors from 'cors'
import express from 'express'
import { createClient } from '@supabase/supabase-js'

// Load api/.env when present; the app must also run without it.
try {
  process.loadEnvFile()
} catch {
  /* .env is optional — Supabase endpoints report 503 until configured */
}

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY } = process.env
// Server-side client prefers the service role key; anon key also works while
// RLS is off (see docs/OPEN_QUESTIONS.md — auth/RLS still undecided).
const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY
const supabase =
  SUPABASE_URL && supabaseKey ? createClient(SUPABASE_URL, supabaseKey) : null

const requireDb = (req, res, next) => {
  if (!supabase) {
    return res.status(503).json({
      error: 'supabase_not_configured',
      detail: 'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in api/.env',
    })
  }
  next()
}
const badReq = (res, msg) => res.status(400).json({ error: msg })
const upstream = (res, error) => res.status(502).json({ error: error.message })

// ---------------------------------------------------------------------------
// Demo identity — SERVER-CONTROLLED, localhost grading only.
// Authentication is an open design decision (BR-12), so requests are scoped to
// one seeded student resolved server-side: DEMO_STUDENT_ID env override, else
// the earliest-created student. The browser never supplies a student ID.
// Limitation: anyone hitting this API acts as that student — local demo only.
// ---------------------------------------------------------------------------
let demoStudentCache = null
async function demoStudentId() {
  if (process.env.DEMO_STUDENT_ID) return process.env.DEMO_STUDENT_ID
  if (demoStudentCache) return demoStudentCache
  const { data, error } = await supabase
    .from('students').select('student_id').order('created_at').limit(1)
  if (error) { console.error('demoStudentId:', error.message); return null }
  demoStudentCache = data?.[0]?.student_id ?? null
  return demoStudentCache
}
const noStudent = (res) =>
  res.status(502).json({ error: 'demo_student_unavailable — is the schema seeded?' })

// Ownership across joins — row must resolve to the demo student or the
// request fails (never trust a browser-supplied student).
async function assignmentOwner(assignmentId) {
  const { data } = await supabase
    .from('assignments')
    .select('assignment_id, course_id, courses!inner(student_id)')
    .eq('assignment_id', assignmentId)
    .maybeSingle()
  return data ? { row: data, student_id: data.courses.student_id } : null
}

const PROGRESS_STATES = ['not_started', 'in_progress', 'completed']

function validateAssignmentFields(body, { partial = false } = {}) {
  const errors = []
  if (!partial || 'title' in body) {
    if (typeof body.title !== 'string' || !body.title.trim()) errors.push('title is required')
  }
  if (!partial || 'due_at' in body) {
    if (!body.due_at || Number.isNaN(Date.parse(body.due_at))) errors.push('due_at must be a valid date-time')
  }
  if (!partial || 'estimated_minutes' in body) {
    const m = Number(body.estimated_minutes)
    if (!Number.isFinite(m) || m < 0) errors.push('estimated_minutes must be a number >= 0')
  }
  if ('progress_state' in body && !PROGRESS_STATES.includes(body.progress_state)) {
    errors.push(`progress_state must be one of ${PROGRESS_STATES.join(', ')}`)
  }
  return errors
}

// ===========================================================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'duedash-api' })
})

app.get('/api/db/health', requireDb, async (req, res) => {
  const { data, error } = await supabase.from('students').select('student_id')
  if (error) {
    return res.status(502).json({ status: 'schema_missing_or_unreachable', detail: error.message })
  }
  res.json({ status: 'ok', service: 'duedash-api', supabase: 'reachable', students: data.length })
})

app.get('/api/me', requireDb, async (req, res) => {
  try {
    const sid = await demoStudentId()
    if (!sid) return noStudent(res)
    const { data, error } = await supabase
      .from('students').select('student_id, display_name, time_zone')
      .eq('student_id', sid).single()
    if (error) return upstream(res, error)
    res.json({ ...data, note: 'server-controlled demo identity; auth undecided (localhost only)' })
  } catch (e) { upstream(res, e) }
})

// ------------------------------------------------------------- courses ----
app.get('/api/courses', requireDb, async (req, res) => {
  const sid = await demoStudentId()
  if (!sid) return noStudent(res)
  let q = supabase
    .from('courses')
    .select('course_id, student_id, course_name, course_number, semester, instructor_name, instructor_email, office_hours, is_archived, archived_at')
    .eq('student_id', sid)
    .order('course_name')
  if (req.query.include_archived !== 'true') q = q.eq('is_archived', false)
  const { data, error } = await q
  if (error) return upstream(res, error)
  res.json(data)
})

app.post('/api/courses/:id/archive', requireDb, async (req, res) => {
  const sid = await demoStudentId()
  if (!sid) return noStudent(res)
  const { data: course } = await supabase
    .from('courses').select('course_id').eq('course_id', req.params.id).eq('student_id', sid).maybeSingle()
  if (!course) return res.status(404).json({ error: 'course not found for this student' })
  const { data, error } = await supabase
    .from('courses')
    .update({ is_archived: true, archived_at: new Date().toISOString() })
    .eq('course_id', req.params.id)
    .select().single()
  if (error) return upstream(res, error)
  res.json(data)
})

// ---------------------------------------------------------- assignments ----
app.get('/api/assignments', requireDb, async (req, res) => {
  const sid = await demoStudentId()
  if (!sid) return noStudent(res)
  // assignment_display = derived-Overdue view; soft-deleted rows excluded.
  const { data, error } = await supabase
    .from('assignment_display').select('*').eq('student_id', sid).order('due_at')
  if (error) return upstream(res, error)
  res.json(data)
})

app.get('/api/assignments/:id', requireDb, async (req, res) => {
  const sid = await demoStudentId()
  if (!sid) return noStudent(res)
  const owned = await assignmentOwner(req.params.id)
  if (!owned || owned.student_id !== sid) {
    return res.status(404).json({ error: 'assignment not found for this student' })
  }
  const { data: assignment, error } = await supabase
    .from('assignment_display').select('*').eq('assignment_id', req.params.id).single()
  if (error) return res.status(404).json({ error: 'assignment not found (or soft-deleted)' })
  const { data: subtasks, error: sErr } = await supabase
    .from('subtasks').select('*')
    .eq('assignment_id', req.params.id).is('deleted_at', null).order('sort_order')
  if (sErr) return upstream(res, sErr)
  res.json({ ...assignment, subtasks })
})

app.post('/api/assignments', requireDb, async (req, res) => {
  const errors = validateAssignmentFields(req.body)
  if (!req.body.course_id) errors.push('course_id is required (BR-01: every assignment needs a course)')
  if (errors.length) return badReq(res, errors.join('; '))
  const sid = await demoStudentId()
  if (!sid) return noStudent(res)

  // Ownership: course must exist and belong to the demo student.
  const { data: course } = await supabase
    .from('courses').select('course_id').eq('course_id', req.body.course_id).eq('student_id', sid).maybeSingle()
  if (!course) return res.status(403).json({ error: 'course_id does not belong to this student' })

  const { data, error } = await supabase
    .from('assignments')
    .insert({
      course_id: req.body.course_id,
      title: req.body.title.trim(),
      due_at: new Date(req.body.due_at).toISOString(),
      estimated_minutes: Number(req.body.estimated_minutes),
      estimate_note: req.body.estimate_note?.trim() || null,
      progress_state: 'not_started',
    })
    .select().single()
  if (error) return upstream(res, error)
  res.status(201).json(data)
})

app.patch('/api/assignments/:id', requireDb, async (req, res) => {
  const sid = await demoStudentId()
  if (!sid) return noStudent(res)
  const owned = await assignmentOwner(req.params.id)
  if (!owned || owned.student_id !== sid) {
    return res.status(404).json({ error: 'assignment not found for this student' })
  }
  const errors = validateAssignmentFields(req.body, { partial: true })
  if (errors.length) return badReq(res, errors.join('; '))

  const allowed = ['title', 'due_at', 'estimated_minutes', 'estimate_note', 'progress_state']
  const patch = {}
  for (const k of allowed) if (k in req.body) patch[k] = req.body[k]
  if ('due_at' in patch) patch.due_at = new Date(patch.due_at).toISOString()
  if ('estimated_minutes' in patch) patch.estimated_minutes = Number(patch.estimated_minutes)
  if ('progress_state' in patch) {
    patch.completed_at = patch.progress_state === 'completed' ? new Date().toISOString() : null
  }
  if (Object.keys(patch).length === 0) return badReq(res, 'no updatable fields supplied')

  const { data, error } = await supabase
    .from('assignments').update(patch).eq('assignment_id', req.params.id).select().single()
  if (error) return upstream(res, error)
  res.json(data)
})

// Selective soft deletion (BR-09/US-16): ?mode=remove also clears linked
// subtasks + plan items; ?mode=keep preserves them as history.
app.delete('/api/assignments/:id', requireDb, async (req, res) => {
  const sid = await demoStudentId()
  if (!sid) return noStudent(res)
  const mode = req.query.mode || 'keep'
  if (!['keep', 'remove'].includes(mode)) {
    return badReq(res, "mode must be 'keep' or 'remove'")
  }
  const owned = await assignmentOwner(req.params.id)
  if (!owned || owned.student_id !== sid) {
    return res.status(404).json({ error: 'assignment not found for this student' })
  }
  const now = new Date().toISOString()
  const { error } = await supabase
    .from('assignments').update({ deleted_at: now }).eq('assignment_id', req.params.id)
  if (error) return upstream(res, error)
  if (mode === 'remove') {
    const { data: subs } = await supabase
      .from('subtasks').select('subtask_id').eq('assignment_id', req.params.id)
    const subIds = (subs ?? []).map((s) => s.subtask_id)
    await supabase.from('subtasks').update({ deleted_at: now }).eq('assignment_id', req.params.id)
    await supabase.from('plan_items').delete().eq('assignment_id', req.params.id)
    if (subIds.length) await supabase.from('plan_items').delete().in('subtask_id', subIds)
  }
  res.json({ deleted: req.params.id, mode, soft_deleted_at: now })
})

// -------------------------------------------------------------- subtasks ---
app.get('/api/subtasks', requireDb, async (req, res) => {
  const sid = await demoStudentId()
  if (!sid) return noStudent(res)
  const { data, error } = await supabase
    .from('subtasks')
    .select('*, assignments!inner(courses!inner(student_id))')
    .eq('assignments.courses.student_id', sid)
    .is('deleted_at', null)
    .order('sort_order')
  if (error) return upstream(res, error)
  res.json(data.map(({ assignments, ...rest }) => rest))
})

app.patch('/api/subtasks/:id', requireDb, async (req, res) => {
  const sid = await demoStudentId()
  if (!sid) return noStudent(res)
  const { data: sub } = await supabase
    .from('subtasks')
    .select('subtask_id, assignments!inner(courses!inner(student_id))')
    .eq('subtask_id', req.params.id).maybeSingle()
  if (!sub || sub.assignments.courses.student_id !== sid) {
    return res.status(404).json({ error: 'subtask not found for this student' })
  }
  if (!PROGRESS_STATES.includes(req.body.progress_state)) {
    return badReq(res, `progress_state must be one of ${PROGRESS_STATES.join(', ')}`)
  }
  const { data, error } = await supabase
    .from('subtasks')
    .update({
      progress_state: req.body.progress_state,
      completed_at: req.body.progress_state === 'completed' ? new Date().toISOString() : null,
    })
    .eq('subtask_id', req.params.id).select().single()
  if (error) return upstream(res, error)
  res.json(data)
})

// Accepted suggestion steps → real subtask rows (US-04). Mechanism stays
// client-side/templates; this endpoint only persists what was accepted.
app.post('/api/subtasks', requireDb, async (req, res) => {
  const { assignment_id, steps } = req.body ?? {}
  if (!assignment_id || !Array.isArray(steps) || steps.length === 0) {
    return badReq(res, 'assignment_id and a non-empty steps[] array are required')
  }
  const sid = await demoStudentId()
  if (!sid) return noStudent(res)
  const owned = await assignmentOwner(assignment_id)
  if (!owned || owned.student_id !== sid) {
    return res.status(403).json({ error: 'assignment_id does not belong to this student' })
  }
  for (const [i, s] of steps.entries()) {
    if (!s.title?.trim()) return badReq(res, `steps[${i}].title is required`)
    if (s.estimated_minutes != null && (!Number.isFinite(Number(s.estimated_minutes)) || Number(s.estimated_minutes) < 0)) {
      return badReq(res, `steps[${i}].estimated_minutes must be >= 0`)
    }
    if (s.due_at != null && Number.isNaN(Date.parse(s.due_at))) {
      return badReq(res, `steps[${i}].due_at must be a valid date-time`)
    }
  }
  const { data: existing } = await supabase
    .from('subtasks').select('sort_order').eq('assignment_id', assignment_id).order('sort_order', { ascending: false }).limit(1)
  const base = existing?.[0]?.sort_order ?? 0
  const rows = steps.map((s, i) => ({
    assignment_id,
    title: s.title.trim(),
    due_at: s.due_at ? new Date(s.due_at).toISOString() : null,
    estimated_minutes: s.estimated_minutes == null ? null : Number(s.estimated_minutes),
    sort_order: base + i + 1,
  }))
  const { data, error } = await supabase.from('subtasks').insert(rows).select()
  if (error) return upstream(res, error)
  res.status(201).json(data)
})

// ---------------------------------------------------------- weekly plans ---
app.get('/api/weekly-plans', requireDb, async (req, res) => {
  const sid = await demoStudentId()
  if (!sid) return noStudent(res)
  const { data, error } = await supabase
    .from('weekly_plans')
    .select('*, plan_items(*)')
    .eq('student_id', sid)
    .order('week_start', { ascending: false })
  if (error) return upstream(res, error)
  res.json(data)
})

// Create a plan manually (US-06): any existing 'current' plan is archived so
// exactly one plan is current per student; history is never deleted (BR-10).
app.post('/api/weekly-plans', requireDb, async (req, res) => {
  const { week_start } = req.body ?? {}
  if (!week_start || !/^\d{4}-\d{2}-\d{2}$/.test(week_start)) {
    return badReq(res, 'week_start is required as YYYY-MM-DD')
  }
  const sid = await demoStudentId()
  if (!sid) return noStudent(res)
  await supabase.from('weekly_plans')
    .update({ plan_state: 'archived', archived_at: new Date().toISOString() })
    .eq('student_id', sid).eq('plan_state', 'current')
  const { data, error } = await supabase
    .from('weekly_plans')
    .insert({ student_id: sid, week_start, plan_state: 'current' })
    .select().single()
  if (error) return upstream(res, error)
  res.status(201).json(data)
})

app.post('/api/plan-items', requireDb, async (req, res) => {
  const { weekly_plan_id, assignment_id, subtask_id, planned_date, planned_minutes } = req.body ?? {}
  if (!weekly_plan_id) return badReq(res, 'weekly_plan_id is required')
  if (Boolean(assignment_id) === Boolean(subtask_id)) {
    return badReq(res, 'exactly one of assignment_id or subtask_id is required (BR-08)')
  }
  if (!planned_date || Number.isNaN(Date.parse(planned_date))) return badReq(res, 'planned_date must be a valid date')
  if (!Number.isFinite(Number(planned_minutes)) || Number(planned_minutes) < 0) {
    return badReq(res, 'planned_minutes must be a number >= 0')
  }
  const sid = await demoStudentId()
  if (!sid) return noStudent(res)
  const { data: plan } = await supabase
    .from('weekly_plans').select('weekly_plan_id').eq('weekly_plan_id', weekly_plan_id).eq('student_id', sid).maybeSingle()
  if (!plan) return res.status(403).json({ error: 'weekly_plan_id does not belong to this student' })
  if (assignment_id) {
    const owned = await assignmentOwner(assignment_id)
    if (!owned || owned.student_id !== sid) {
      return res.status(403).json({ error: 'assignment_id does not belong to this student' })
    }
  } else {
    const { data: sub } = await supabase
      .from('subtasks').select('subtask_id, assignments!inner(courses!inner(student_id))')
      .eq('subtask_id', subtask_id).maybeSingle()
    if (!sub || sub.assignments.courses.student_id !== sid) {
      return res.status(403).json({ error: 'subtask_id does not belong to this student' })
    }
  }
  const { data, error } = await supabase
    .from('plan_items')
    .insert({ weekly_plan_id, assignment_id: assignment_id ?? null, subtask_id: subtask_id ?? null,
      planned_date, planned_minutes: Number(planned_minutes) })
    .select().single()
  if (error) return upstream(res, error)
  res.status(201).json(data)
})

// Ownership helper for plan items: item → plan → student.
async function planItemOwner(planItemId) {
  const { data } = await supabase
    .from('plan_items')
    .select('plan_item_id, weekly_plans!inner(student_id)')
    .eq('plan_item_id', planItemId).maybeSingle()
  return data ? { row: data, student_id: data.weekly_plans.student_id } : null
}

// Manually edit a planned item's day/minutes.
app.patch('/api/plan-items/:id', requireDb, async (req, res) => {
  const patch = {}
  if ('planned_date' in req.body) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(req.body.planned_date)) {
      return badReq(res, 'planned_date must be YYYY-MM-DD')
    }
    patch.planned_date = req.body.planned_date
  }
  if ('planned_minutes' in req.body) {
    if (!Number.isFinite(Number(req.body.planned_minutes)) || Number(req.body.planned_minutes) < 0) {
      return badReq(res, 'planned_minutes must be a number >= 0')
    }
    patch.planned_minutes = Number(req.body.planned_minutes)
  }
  if (Object.keys(patch).length === 0) return badReq(res, 'no updatable fields supplied')
  const sid = await demoStudentId()
  if (!sid) return noStudent(res)
  const owned = await planItemOwner(req.params.id)
  if (!owned || owned.student_id !== sid) {
    return res.status(404).json({ error: 'plan item not found for this student' })
  }
  const { data, error } = await supabase
    .from('plan_items').update(patch).eq('plan_item_id', req.params.id).select().single()
  if (error) return upstream(res, error)
  res.json(data)
})

// Manually remove a planned item (the underlying work is untouched).
app.delete('/api/plan-items/:id', requireDb, async (req, res) => {
  const sid = await demoStudentId()
  if (!sid) return noStudent(res)
  const owned = await planItemOwner(req.params.id)
  if (!owned || owned.student_id !== sid) {
    return res.status(404).json({ error: 'plan item not found for this student' })
  }
  const { error } = await supabase
    .from('plan_items').delete().eq('plan_item_id', req.params.id)
  if (error) return upstream(res, error)
  res.json({ deleted: req.params.id })
})

// ------------------------------------------------------------ commitments --
app.get('/api/commitments', requireDb, async (req, res) => {
  const sid = await demoStudentId()
  if (!sid) return noStudent(res)
  const { data, error } = await supabase
    .from('commitments').select('*').eq('student_id', sid).order('starts_at')
  if (error) return upstream(res, error)
  res.json(data)
})

app.post('/api/commitments', requireDb, async (req, res) => {
  const { kind, title, starts_at, ends_at, recurrence_rule } = req.body ?? {}
  if (!['class', 'work', 'personal'].includes(kind)) return badReq(res, "kind must be class, work, or personal")
  if (!title?.trim()) return badReq(res, 'title is required')
  if (Number.isNaN(Date.parse(starts_at)) || Number.isNaN(Date.parse(ends_at))) {
    return badReq(res, 'starts_at and ends_at must be valid date-times')
  }
  if (!(new Date(ends_at) > new Date(starts_at))) return badReq(res, 'ends_at must be after starts_at')
  const sid = await demoStudentId()
  if (!sid) return noStudent(res)
  const { data, error } = await supabase
    .from('commitments')
    .insert({ student_id: sid, kind, title: title.trim(),
      starts_at: new Date(starts_at).toISOString(), ends_at: new Date(ends_at).toISOString(),
      recurrence_rule: recurrence_rule || null })
    .select().single()
  if (error) return upstream(res, error)
  res.status(201).json(data)
})

// ----------------------------------------------------------------- alerts --
app.get('/api/alerts', requireDb, async (req, res) => {
  const sid = await demoStudentId()
  if (!sid) return noStudent(res)
  const { data, error } = await supabase
    .from('alerts').select('*').eq('student_id', sid).order('created_at', { ascending: false })
  if (error) return upstream(res, error)
  res.json(data)
})

// Missed-plan alerts (US-19): any planned item whose day has PASSED in the
// student's time zone and whose target is still incomplete gets a missed_plan
// alert. PROTOTYPE ASSUMPTION: generated on request (each client load), not
// by a scheduler — "day passed" is evaluated against students.time_zone at
// call time. Idempotent: an existing alert for the same plan_item means no
// duplicate is created, so reloads don't spam alerts.
app.post('/api/alerts/generate-missed', requireDb, async (req, res) => {
  const sid = await demoStudentId()
  if (!sid) return noStudent(res)
  const { data: student } = await supabase
    .from('students').select('time_zone').eq('student_id', sid).single()
  const tz = student?.time_zone || 'UTC'
  const today = new Date().toLocaleDateString('en-CA', { timeZone: tz }) // YYYY-MM-DD in student's tz

  const { data: items, error } = await supabase
    .from('plan_items')
    .select('plan_item_id, weekly_plan_id, assignment_id, subtask_id, planned_date, weekly_plans!inner(student_id)')
    .eq('weekly_plans.student_id', sid)
    .lt('planned_date', today)
  if (error) return upstream(res, error)

  const { data: existing } = await supabase
    .from('alerts').select('plan_item_id').eq('student_id', sid).eq('alert_type', 'missed_plan')
  const alerted = new Set((existing ?? []).map((a) => a.plan_item_id))

  let created = 0
  for (const it of items ?? []) {
    if (alerted.has(it.plan_item_id)) continue // dedupe — reload-safe
    // Completion check on the actual target: completed work never alerts.
    const table = it.assignment_id ? 'assignments' : 'subtasks'
    const col = it.assignment_id ? 'assignment_id' : 'subtask_id'
    const { data: target } = await supabase
      .from(table).select('progress_state, assignment_id').eq(col, it.assignment_id ?? it.subtask_id).maybeSingle()
    if (!target || target.progress_state === 'completed') continue
    const { error: insErr } = await supabase.from('alerts').insert({
      student_id: sid,
      plan_item_id: it.plan_item_id,
      assignment_id: it.assignment_id ?? target.assignment_id ?? null,
      alert_type: 'missed_plan',
    })
    // 23505 = unique violation (alerts_one_alert_per_plan_item) — a
    // concurrent scan already inserted; not a real failure.
    if (insErr && insErr.code !== '23505') return upstream(res, insErr)
    if (!insErr) created++
  }
  res.json({ checked: items?.length ?? 0, created, student_time_zone: tz, student_today: today })
})

app.patch('/api/alerts/:id', requireDb, async (req, res) => {
  const sid = await demoStudentId()
  if (!sid) return noStudent(res)
  const { data: alert } = await supabase
    .from('alerts').select('alert_id').eq('alert_id', req.params.id).eq('student_id', sid).maybeSingle()
  if (!alert) return res.status(404).json({ error: 'alert not found for this student' })
  if (!['read', 'dismissed', 'unread'].includes(req.body.alert_state)) {
    return badReq(res, 'alert_state must be read, dismissed, or unread')
  }
  const { data, error } = await supabase
    .from('alerts')
    .update({ alert_state: req.body.alert_state,
      read_at: req.body.alert_state === 'unread' ? null : new Date().toISOString() })
    .eq('alert_id', req.params.id).select().single()
  if (error) return upstream(res, error)
  res.json(data)
})

// JSON error handler — unexpected upstream/async failures as 502, never HTML.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => upstream(res, err))

// Localhost grading demo: bind to loopback only (US-18 local demo access).
app.listen(PORT, '127.0.0.1', () => {
  console.log(`DueDash API listening on http://127.0.0.1:${PORT}`)
  console.log(
    supabase
      ? `Supabase: configured (${SUPABASE_SERVICE_ROLE_KEY ? 'service role' : 'anon'} key)`
      : 'Supabase: NOT configured (api/.env missing)',
  )
})
