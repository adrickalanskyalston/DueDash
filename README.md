# DueDash

A private student planning app that helps college students **catch up on
overdue coursework**. Built for MINS 350. Catching up is the primary goal;
preventing future late work is secondary.

> **Status:** scaffold only — runnable skeleton, no features implemented yet.
> See `docs/PRD.md` for requirements and `docs/TASKS.md` for the roadmap.

## Project layout

```
client/               React + Vite frontend (JavaScript)
api/                  Node.js + Express API
db/                   Prototype 2 schema + seed SQL (Level 2 spec)
supabase/migrations/  future database migrations
supabase/seeds/       future seed data
docs/                 PRD, task list, workspace rules, open questions
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer (includes npm)
- Git

No Supabase account or credentials are needed to run the scaffold.

## Setup

Clone the repo, then install dependencies in both packages:

```bash
git clone https://github.com/adrickalanskyalston/DueDash.git
cd DueDash

cd api && npm install
cd ../client && npm install
```

### Optional: environment files

The scaffold runs fine with defaults. To customize, copy the examples:

```bash
cp api/.env.example api/.env        # e.g. change PORT
cp client/.env.example client/.env  # e.g. point at a different API URL
```

### Supabase (Prototype 2)

The API talks to **hosted Supabase** — no local database needed. To point it
at a test project:

1. Create a (disposable) project at <https://supabase.com>.
2. In **SQL Editor**, run `db/01_schema.sql` then `db/02_seed.sql`.
3. In **Project Settings → API Keys**, copy the Project URL and anon key into
   `api/.env` (see `api/.env.example`).

Without these env vars the API still runs — the `/api/*` endpoints just
return `503 supabase_not_configured`.

Endpoints (read-only for now): `GET /health` · `GET /api/db/health` ·
`GET /api/students` · `GET /api/courses` · `GET /api/assignments`
(reads the derived-Overdue view; `?student_id=` filters).

## Running locally

Open **two terminals** from the repo root:

```bash
# Terminal 1 — API on http://localhost:3001
cd api
npm run dev

# Terminal 2 — frontend on http://localhost:5173
cd client
npm run dev
```

## Health check

With the API running, verify it responds:

```bash
curl http://localhost:3001/health
# {"status":"ok","service":"duedash-api"}
```

Then open <http://localhost:5173> in a browser — you should see the plain
"DueDash" placeholder page.

## Stack (Builder choices — not client-confirmed)

| Layer    | Choice                        |
| -------- | ----------------------------- |
| Frontend | React + Vite, JavaScript      |
| Backend  | Node.js + Express             |
| Database | Supabase PostgreSQL (planned) |
| Platform | Responsive web app            |

## Documentation

- [docs/PRD.md](docs/PRD.md) — product requirements from Specification #1,
  including all 11 selected user stories and scope boundaries
- [docs/TASKS.md](docs/TASKS.md) — phased development plan (T-01–T-32) with
  dependencies and acceptance criteria
- [docs/WORKSPACE_RULES.md](docs/WORKSPACE_RULES.md) — naming, branching,
  commit, PR, and merge-validation conventions
- [docs/OPEN_QUESTIONS.md](docs/OPEN_QUESTIONS.md) — unconfirmed decisions
  blocking specific tasks
- [supabase/README.md](supabase/README.md) — database layout and credential
  policy
