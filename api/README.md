# DueDash API (Express + hosted Supabase)

Prototype 2 grading demo. The browser calls **only** this API — it never
talks to Supabase directly.

## Local setup (Windows)

```bat
cd api
copy .env.example .env
```

Edit `api/.env` and fill in values from your Supabase project
(Dashboard → Project Settings → API):

| Variable | Purpose |
|---|---|
| `PORT` | API port (default 3001) |
| `SUPABASE_URL` | Project URL, e.g. `https://<ref>.supabase.co` |
| `SUPABASE_ANON_KEY` | Kept from the template; used only if no service key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side key (preferred for this demo) |
| `DEMO_STUDENT_ID` | Optional — pin the demo identity; defaults to the earliest-created seeded student |

Never commit `.env` — it is gitignored. Only `.env.example` is tracked.

## Database: script order

Run **in order** on a clean Supabase project (SQL Editor → New query → paste → Run):

1. `db/01_schema.sql` — 8 tables + checks + `assignment_display` view + ownership trigger
2. `db/02_seed.sql` — fictional rows (3 students, 4 courses, 5 assignments, …)

Verify with `db/README.md`'s row-count + rejection queries, then:

```bat
curl http://localhost:3001/api/db/health
:: expect {"status":"ok",...,"students":3}
```

## Run

```bat
cd api && npm install && npm run dev    :: API on http://127.0.0.1:3001
cd client && npm install && npm run dev :: UI on http://localhost:5173
```

Routes: see `api/openapi.yaml` — courses (+archive), assignments
(list/detail/create/patch/selective delete), subtasks (bulk from accepted
suggestions + toggle), weekly-plans (+manual create, plan-items add/edit/
remove), commitments, alerts (+generate-missed).

## Verify the live UI

Open http://localhost:5173 → Dashboard shows real seeded data.
**Write test:** `+ Add Assignment` → fill the shared form → submit → the new
assignment appears in Assignment List, its Detail page, and stays there after
a browser reload (proof it round-tripped through Express to Supabase).

## Identity limitation (localhost demo only)

Authentication is an open decision, so the API scopes every request to ONE
seeded student chosen **server-side** (`DEMO_STUDENT_ID` or earliest student).
The browser cannot choose or change who it acts as; a student ID in a request
body is ignored/not accepted. Express binds to **127.0.0.1 only** and the
Supabase service role key lives only in server env vars — never in the
browser bundle. Even so, do not expose this API beyond localhost.

## Missed-plan alerts (prototype assumption)

`POST /api/alerts/generate-missed` scans planned items whose `planned_date`
is before "today" **in the student's `time_zone`** and creates a
`missed_plan` alert for incomplete targets. It runs on each client load —
there is no scheduler in this prototype. It is idempotent (one alert per
plan_item, ever), so reloads don't duplicate. Completed work never alerts.
Real delivery timing/channel stays open (see `docs/OPEN_QUESTIONS.md`).

## Smoke test

With the API running and the DB seeded:

```bat
:: Git Bash
BASE_URL=http://localhost:3001 bash tests/smoke.sh
```

Exercises 3+ GETs, a valid write (201), and invalid-input 4xxs; exits nonzero
on any failure. Needs no Supabase keys — it only calls Express.
