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

Leave the `SUPABASE_*` values blank for now — the database is not wired up yet.

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
