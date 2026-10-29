# DueDash — Workspace Rules

Conventions for working in this repository. Update as the project evolves —
and update this file (with the rest of `docs/`) whenever requirements or
technical decisions change.

## Layout

- `client/` — React + Vite frontend (JavaScript, not TypeScript)
- `api/` — Node.js + Express backend (ES modules)
- `supabase/migrations/` — SQL migrations, applied in filename order
- `supabase/seeds/` — seed data for local/dev use
- `docs/` — PRD, task plan, open questions, these rules

## Naming conventions

- **React components:** `PascalCase` — component files and the components
  they export match (e.g. `DailyChecklist.jsx` → `function DailyChecklist()`).
- **JavaScript variables/functions:** `camelCase` (e.g. `dueDate`,
  `fetchAssignments`). Constants that are truly fixed may use
  `UPPER_SNAKE_CASE`.
- **Database:** `snake_case` throughout — plural `snake_case` table names
  (`courses`, `assignment_steps`) and `snake_case` column names
  (`due_at`, `estimated_minutes`). Migrations are numbered
  (`0001_init.sql`, `0002_….sql`).

## Branching strategy

- `main` stays runnable at all times — the scaffold and every merge must
  leave `npm run dev` working in both `client/` and `api/`.
- Feature work happens on **short-lived branches** named after the task/story:
  `feature/us-01-course-organization`, `feature/t-13-priority-ordering`.
- Docs/scaffold work may commit directly to `main` in small, focused commits;
  feature implementation goes through a branch + PR (below).

## Commits

Small commits tied to the specification — one task or one story slice per
commit. Use conventional prefixes:

- `feat:` feature work → `feat: add course label endpoints (US-01, T-07)`
- `fix:` bug fixes → `fix: overdue flag on same-day deadlines`
- `docs:` documentation → `docs: define Phase 1 requirements`
- `chore:` scaffolding/tooling → `chore: scaffold DueDash workspace`
- `refactor:` / `test:` as needed

Reference the task ID (and story ID for features) in the message so the work
traces back to `docs/TASKS.md`.

## Pull requests

Every PR should include:

1. **What changed and why** — tied to the specification, not invented scope.
2. **Linked IDs** — task and user story (e.g. "Implements T-13 / US-03").
3. **Verification** — commands run and results observed (build output, curl
   responses, screenshots of the checklist/demonstration step).

**Review:** ask a teammate to review before merging when one is available.
For solo work, self-review the diff and re-run the verification steps before
merging.

## Merge validation

Before merging any change:

- `cd client && npm run build` succeeds.
- `cd api && npm start` boots and `curl http://localhost:3001/health`
  returns `{"status":"ok"}`.
- `cd client && npm run lint` clean (or warnings explained in the PR).
- Any touched acceptance criterion from `docs/TASKS.md` was exercised by hand
  until automated tests exist.

## Scope and data rules

- **Spec-driven changes only.** Implement the confirmed V1 scope in
  `docs/PRD.md` / `docs/TASKS.md`. Do **not** implement deferred items
  (Canvas import, calendar sync, OCR, integrations) or rejected stories
  without an explicit scope decision recorded in `docs/`.
- **Unresolved rules stay unresolved.** Tasks marked `Blocked — needs
  decision` wait for an answer in `docs/OPEN_QUESTIONS.md`; don't code around
  them by guessing.
- **No committed credentials or personal student data.** Real `.env` files,
  Supabase keys, and any real student information never enter the repo —
  `.env.example` holds placeholders only, and seed data must be fictional.
- **Runs without the database.** The scaffold and local dev flow must keep
  working without live Supabase credentials until provisioning is decided.

## Commands

| Action | Command |
| ------ | ------- |
| Frontend dev server | `cd client && npm run dev` |
| API dev server (auto-restart) | `cd api && npm run dev` |
| API production-style start | `cd api && npm start` |
| API health check | `curl http://localhost:3001/health` |
| Client production build | `cd client && npm run build` |
| Client lint | `cd client && npm run lint` |
| Client preview of build | `cd client && npm run preview` |
