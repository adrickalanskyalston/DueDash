import cors from 'cors'
import express from 'express'
import { createClient } from '@supabase/supabase-js'

// Load api/.env when present; the app must also run without it (no creds yet).
try {
  process.loadEnvFile()
} catch {
  /* .env is optional — Supabase endpoints report 503 until configured */
}

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env
const supabase =
  SUPABASE_URL && SUPABASE_ANON_KEY
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null

const requireDb = (req, res, next) => {
  if (!supabase) {
    return res.status(503).json({
      error: 'supabase_not_configured',
      detail: 'Set SUPABASE_URL and SUPABASE_ANON_KEY in api/.env',
    })
  }
  next()
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'duedash-api' })
})

// Connectivity check against hosted Supabase (Prototype 2 verification aid).
app.get('/api/db/health', requireDb, async (req, res) => {
  const { data, error } = await supabase.from('students').select('student_id')
  if (error) {
    return res.status(502).json({ status: 'schema_missing_or_unreachable', detail: error.message })
  }
  res.json({ status: 'ok', service: 'duedash-api', supabase: 'reachable', students: data.length })
})

// Seed/verification aids — read-only views over the Prototype 2 schema.
app.get('/api/students', requireDb, async (req, res) => {
  const { data, error } = await supabase
    .from('students')
    .select('student_id, display_name, time_zone')
    .order('created_at')
  if (error) return res.status(502).json({ error: error.message })
  res.json(data)
})

app.get('/api/courses', requireDb, async (req, res) => {
  let query = supabase
    .from('courses')
    .select('course_id, student_id, course_name, course_number, semester, is_archived')
    .order('course_name')
  if (req.query.student_id) query = query.eq('student_id', req.query.student_id)
  if (req.query.include_archived !== 'true') query = query.eq('is_archived', false)
  const { data, error } = await query
  if (error) return res.status(502).json({ error: error.message })
  res.json(data)
})

// Reads the assignment_display VIEW so derived 'Overdue' is exercised (BR-04).
app.get('/api/assignments', requireDb, async (req, res) => {
  let query = supabase
    .from('assignment_display')
    .select('*')
    .order('due_at')
  if (req.query.student_id) query = query.eq('student_id', req.query.student_id)
  const { data, error } = await query
  if (error) return res.status(502).json({ error: error.message })
  res.json(data)
})

app.listen(PORT, () => {
  console.log(`DueDash API listening on http://localhost:${PORT}`)
  console.log(supabase ? 'Supabase: configured' : 'Supabase: NOT configured (api/.env missing)')
})
