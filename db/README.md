# db/ — Prototype 2 database scripts

Source: **Level 2 Specification** §3.3–§3.5 (supersedes the Level 1
`docs/PRD.md` §7.3 draft model wherever they differ).

| File | Purpose | Run |
| ---- | ------- | --- |
| `01_schema.sql` | Tables, keys, checks, ownership triggers, derived-Overdue view | 1st |
| `02_seed.sql` | Fictional seed data in dependency order | 2nd |
| `03_rls.sql` | RLS on all 8 tables; service-role-only access incl. the view | 3rd |

Run all three in the Supabase **SQL Editor** on a clean test project, in
order. ⚠️ `01_schema.sql` **drops** existing DueDash tables — use a
designated empty test project; never run it against a project with data
you want to keep. `03_rls.sql` is idempotent and safe to re-run on an
already-seeded project.

Posture after `03_rls.sql`: RLS on all eight tables; `service_role` (the
Express API key) has full access via `service_role_all` policies;
`anon`/`authenticated` have nothing; `assignment_display` runs with
`security_invoker` and is granted to `service_role` only. Per-user
policies are deferred until authentication is decided — see
`docs/OPEN_QUESTIONS.md`.

## Analyst entity → physical table (for the grader)

| Analyst entity | Physical table | Notes |
| -------------- | -------------- | ----- |
| `Student` | `students` | |
| `Course` | `courses` | archived via `is_archived`/`archived_at` (BR-03) |
| `Assignment` | `assignments` | soft delete via `deleted_at` (BR-09) |
| `Subtask` | `subtasks` | optional `due_at` (US-14) |
| `Commitment` | `commitments` | `ends_at > starts_at` enforced |
| `WeeklyPlan` | `weekly_plans` | `plan_state`: draft/current/archived |
| `PlanItem` | `plan_items` | XOR target: `assignment_id` **or** `subtask_id` (BR-08) |
| `Alert` | `alerts` | `due_soon`/`overdue`/`missed_plan` |

Column names match the spec exactly (`student_id`, `due_at`,
`estimated_minutes`, `progress_state`, …). Type mapping and conventions are
documented at the top of `01_schema.sql`.

## Notable enforced rules

- Exclusive PlanItem reference (exactly one of assignment/subtask) — CHECK.
- Same-student ownership across joins — `plan_item_owner_matches()` and
  `alert_owner_matches()` triggers (BR-08/BR-12).
- `Overdue` is **derived** in view `assignment_display`, never stored (BR-04).
- Nonnegative `estimated_minutes` / `planned_minutes`; commitment
  `ends_at > starts_at`; state enums via CHECK.
- Soft delete preserves FKs (no `ON DELETE CASCADE`); completed/archived rows
  are retained for history.

## Verification queries (Supabase SQL Editor)

See the handoff notes / `docs/` — run counts on all eight tables, exercise
the invalid-reference and cross-student rejection cases, and query
`assignment_display` for the derived `display_state`.
