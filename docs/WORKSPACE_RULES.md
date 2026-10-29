# DueDash — Workspace Rules

Conventions for working in this repository. Update as the project evolves.

## Layout

- `client/` — React + Vite frontend (JavaScript, not TypeScript)
- `api/` — Node.js + Express backend (ES modules)
- `supabase/migrations/` — SQL migrations, applied in filename order
- `supabase/seeds/` — seed data for local/dev use
- `docs/` — PRD, tasks, open questions, these rules

## Commands

- Frontend dev server: `cd client && npm run dev`
- API dev server (auto-restart): `cd api && npm run dev`
- API tests of life: `curl http://localhost:3001/health`
- Client production build: `cd client && npm run build`

## Rules

- Never commit real `.env` files or secrets; `.env.example` holds placeholders
  only. Real Supabase keys are added later via local `.env`.
- The scaffold must run locally without Supabase credentials — keep features
  degrading gracefully when env vars are absent.
- JavaScript (not TypeScript) for now; keep dependencies minimal.
- Small, focused commits on `main` are fine for this course project.
- Feature code stays out of scope until the corresponding Phase in
  `docs/TASKS.md` is reached and requirements are confirmed.
