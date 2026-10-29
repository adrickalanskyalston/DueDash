# DueDash — Task List

Status legend: `[ ]` not started · `[~]` in progress · `[x]` done

## Phase 0 — Scaffold (this assignment)

- [x] Project structure: `client/`, `api/`, `supabase/`, `docs/`
- [x] Runnable React placeholder (Vite)
- [x] Runnable Express API with `GET /health`
- [x] `.gitignore`, `.env.example` files, README, docs
- [ ] Push scaffold to GitHub

## Phase 1 — Data foundation

- [ ] Provision Supabase project (deferred until credentials approved)
- [ ] Decide auth approach (see OPEN_QUESTIONS.md)
- [ ] Draft schema: courses, assignments, subtasks, commitments, reminders
- [ ] First migration in `supabase/migrations/`
- [ ] Seed data in `supabase/seeds/`

## Phase 2 — Core entry & organization (modules 1.1–1.3)

- [ ] Course labels: create/list
- [ ] Assignment CRUD: name, course, due date, estimated time
- [ ] Ordering by overdue status then due date

## Phase 3 — Planning (modules 2.1–2.4)

- [ ] Optional subtask breakdown suggestions (editable/declinable)
- [ ] Availability & commitments entry
- [ ] Weekly catch-up plan generation
- [ ] Daily checklist with estimated durations

## Phase 4 — Dashboard & progress (modules 3.1–3.4)

- [ ] Dashboard: today, overdue, upcoming, add-assignment action
- [ ] Completion marking
- [ ] Catch-up progress indicator
- [ ] Deadline reminders (delivery channel TBD)

## Phase 5 — V1 demo polish

- [ ] End-to-end walkthrough per PRD "Demonstration of Success"
