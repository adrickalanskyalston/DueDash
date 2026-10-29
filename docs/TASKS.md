# DueDash — Development Task Plan

Breakdown of the 11 selected Phase 1 user stories (see `docs/PRD.md` §5) into
implementable tasks, plus the supporting infrastructure they need.

**Current deliverable:** scaffold + this plan. Feature tasks are defined but
**not implemented**.

**Status values:** `Done` (completed and verified) · `Not started` ·
`Blocked — needs decision` (tied to an item in `docs/OPEN_QUESTIONS.md`).

**Ordering:** foundation → course/assignment data → prioritization → optional
breakdown → commitments → weekly plan → daily checklist → completion →
progress → dashboard → reminders → end-to-end demo.

Tasks marked *(infrastructure)* support the stories without inventing new
ones. Tasks marked **[OQ]** depend on an unresolved rule — do not implement
them as if the answer were decided; resolve the linked question first.

---

## Phase 0 — Foundation (supporting infrastructure)

### T-01 — Project scaffold and documentation
- **Story:** — *(infrastructure)*
- **Depends on:** —
- **Status:** Done

Repo structure (`client/`, `api/`, `supabase/`, `docs/`), runnable Vite React
placeholder, Express API, README, `.gitignore`, `.env.example` files.
**Acceptance:** `GET /health` returns `{"status":"ok"}`; client builds with
`npm run build`; repo committed on `main`. *(Verified Oct 28, 2026.)*

### T-02 — Supabase project provisioning
- **Story:** — *(infrastructure)*
- **Depends on:** —
- **Status:** Blocked — needs decision

Provision the Supabase project and place keys in `api/.env` (never commit).
**[OQ]** `OPEN_QUESTIONS.md` → Supabase provisioning (owner, region, timing).
**Acceptance:** API connects to a real Supabase instance using env vars;
documented in README. Scaffold must keep working without credentials.

### T-03 — Initial database migration
- **Story:** — *(infrastructure; serves US-01, US-02, US-04, US-05, US-11)*
- **Depends on:** T-02
- **Status:** Not started

Create `supabase/migrations/` SQL for the proposed tables in PRD §7.3
(courses, assignments, assignment_steps, commitments, reminders — plan_items
only if persisted plans are chosen). **[OQ]** user identity/`user_id` columns
depend on the sign-in decision; date column types depend on the timezone
decision. **Acceptance:** migration applies cleanly on a fresh database;
`supabase/seeds/` can load sample rows.

### T-04 — API routing and persistence layer
- **Story:** — *(infrastructure)*
- **Depends on:** T-03
- **Status:** Not started

REST route structure (`/courses`, `/assignments`, …), request validation,
error shape, DB access module. **Acceptance:** each resource responds to CRUD
verbs against the real database; invalid input returns a 4xx with a useful
message.

### T-05 — Client API helper and env wiring
- **Story:** — *(infrastructure)*
- **Depends on:** T-04
- **Status:** Not started

Small fetch wrapper reading `VITE_API_URL`, shared response/error handling.
**Acceptance:** client renders data fetched from the API; missing API produces
a visible, non-crashing error state.

### T-06 — Authentication and session handling
- **Story:** — *(infrastructure)*
- **Depends on:** T-02
- **Status:** Blocked — needs decision

Wire whatever sign-in mechanism is chosen (none approved yet).
**[OQ]** `OPEN_QUESTIONS.md` → sign-in, persistence, privacy, device support.
**Acceptance:** decided once auth method is confirmed — data must be scoped
per student if accounts exist.

---

## Phase 1 — Course & assignment data (US-01, US-02)

### T-07 — Course label endpoints
- **Story:** US-01 — 1.1 Course Organization
- **Depends on:** T-04
- **Status:** Not started

CRUD endpoints for course labels. **Acceptance:** a created label is returned
by list/read calls and survives an API restart.

### T-08 — Course label management UI
- **Story:** US-01 — 1.1 Course Organization
- **Depends on:** T-05, T-07
- **Status:** Not started

Create and list course labels in the client. **Acceptance:** a label created
in the UI still appears after a page reload.

### T-09 — Assignment endpoints
- **Story:** US-02 — 1.2 Assignment Entry & Editing
- **Depends on:** T-04, T-07
- **Status:** Not started

CRUD for assignments carrying name, course, due date, and estimated
completion time — the client-confirmed minimum fields. **Acceptance:** each
field round-trips through the API unchanged; missing required fields are
rejected.

### T-10 — Assignment entry/edit form
- **Story:** US-02 — 1.2 Assignment Entry & Editing
- **Depends on:** T-05, T-09
- **Status:** Not started

Form to add and update the four fields; estimate stays editable later.
**Acceptance:** an assignment retains its name, course, due date, and
estimated duration after saving and reloading; edited values overwrite the
old ones.

### T-11 — Assignments grouped by course
- **Story:** US-01 — 1.1 Course Organization
- **Depends on:** T-08, T-10
- **Status:** Not started

Assignment list grouped under course labels. **Acceptance:** each assignment
renders under its course; a student can see workload per class at a glance.

---

## Phase 2 — Prioritization (US-03)

### T-12 — Overdue status derivation
- **Story:** US-03 — 1.3 Deadline Prioritization
- **Depends on:** T-09
- **Status:** Blocked — needs decision

Derive overdue from due date plus completion state. **[OQ]**
`OPEN_QUESTIONS.md` → date/timezone handling (what counts as "overdue",
date-only vs. timestamp, local timezone). **Acceptance:** an unfinished
assignment past its due date reports overdue; a completed or future one does
not — under the confirmed rule.

### T-13 — Priority ordering
- **Story:** US-03 — 1.3 Deadline Prioritization
- **Depends on:** T-12
- **Status:** Blocked — needs decision

Order visible work by overdue status then due date; student-editable
estimates. **[OQ]** `OPEN_QUESTIONS.md` → priority ties and manual
reordering. **Acceptance:** unfinished overdue assignments appear ahead of
unfinished upcoming ones, with due-date ordering within each group, in both
API output and UI.

---

## Phase 3 — Optional task breakdown (US-04)

### T-14 — Subtask persistence and endpoints
- **Story:** US-04 — 2.1 Optional Task Breakdown
- **Depends on:** T-03
- **Status:** Not started

`assignment_steps` CRUD linked to a parent assignment, each with its own
estimate and status. **Acceptance:** kept subtasks persist under their
assignment and survive reload.

### T-15 — Smaller-step suggestion mechanism
- **Story:** US-04 — 2.1 Optional Task Breakdown
- **Depends on:** T-14
- **Status:** Blocked — needs decision

Generate suggested steps for a large assignment on request only.
**[OQ]** `OPEN_QUESTIONS.md` → suggestion generation. AI generation is **not
assumed** — templates, rules, or other mechanisms are all candidates.
**Acceptance:** requesting suggestions on one assignment returns a reviewable
list; nothing is saved until the student keeps it.

### T-16 — Suggestion review UI (edit / keep / decline)
- **Story:** US-04 — 2.1 Optional Task Breakdown
- **Depends on:** T-15
- **Status:** Not started

Student-facing review of suggestions. **Acceptance:** students can request
suggestions, edit them before keeping them, or decline them — declining adds
no subtasks; kept (possibly edited) steps appear under the assignment.

---

## Phase 4 — Availability & commitments (US-05)

### T-17 — Commitment endpoints
- **Story:** US-05 — 2.2 Availability & Commitments
- **Depends on:** T-03
- **Status:** Not started

CRUD for class, work, and personal commitments (kind, title, start/end,
optional recurrence). **Acceptance:** a work shift entered once is returned
on later reads with its times intact.

### T-18 — Commitment entry UI
- **Story:** US-05 — 2.2 Availability & Commitments
- **Depends on:** T-05, T-17
- **Status:** Not started

Entry/list UI for the three commitment kinds. **Acceptance:** a student can
record class, work, and personal commitments and see them listed after
reload.

### T-19 — Free-time computation
- **Story:** US-05 — 2.2 Availability & Commitments
- **Depends on:** T-17
- **Status:** Blocked — needs decision

Compute study availability as waking/study hours minus commitments.
**[OQ]** `OPEN_QUESTIONS.md` → timezone handling; what bounds a plannable
day is undefined. **Acceptance:** time inside a recorded commitment is never
reported as available, under the confirmed rule.

---

## Phase 5 — Weekly catch-up plan (US-06)

### T-20 — Weekly distribution logic
- **Story:** US-06 — 2.3 Weekly Catch-up Plan
- **Depends on:** T-13, T-19
- **Status:** Blocked — needs decision

Spread unfinished work across the week using priority order, estimates, and
availability. **[OQ]** `OPEN_QUESTIONS.md` → overbooked-time rule (more work
than available time — behavior undecided). **Acceptance:** suggested day
allocations respect both due-date priority and free-time limits, and the
overbooked case behaves per the confirmed rule.

### T-21 — Weekly overview UI
- **Story:** US-06 — 2.3 Weekly Catch-up Plan
- **Depends on:** T-05, T-20
- **Status:** Not started

Week view of the suggested plan. **Acceptance:** each day shows its planned
work; the distribution updates when inputs (deadlines, estimates,
commitments) change.

---

## Phase 6 — Daily checklist (US-07)

### T-22 — Daily checklist derivation
- **Story:** US-07 — 2.4 Daily Checklist & Time Estimates
- **Depends on:** T-20
- **Status:** Not started

Extract today's planned items with per-item durations. **Acceptance:** the
checklist for a given day contains exactly that day's planned tasks/steps
with their estimated durations.

### T-23 — Daily checklist UI
- **Story:** US-07 — 2.4 Daily Checklist & Time Estimates
- **Depends on:** T-05, T-22
- **Status:** Not started

Checklist view for today. **Acceptance:** a student sees what to work on
today and how long each item may take.

---

## Phase 7 — Completion tracking (US-09)

### T-24 — Completion endpoints
- **Story:** US-09 — 3.2 Completion Tracking
- **Depends on:** T-09, T-14
- **Status:** Blocked — needs decision

Mark assignments and subtasks complete/incomplete. **[OQ]**
`OPEN_QUESTIONS.md` → parent/subtask completion behavior (auto-complete,
cascade, partial states). **Acceptance:** completing work updates the
remaining-work calculation without double-counting assignments and subtasks;
state persists across reload.

### T-25 — Completion controls in UI
- **Story:** US-09 — 3.2 Completion Tracking
- **Depends on:** T-23, T-24
- **Status:** Not started

Complete/reopen controls on checklist and assignment views. **Acceptance:**
marking an item complete removes it from remaining work in every affected
view without duplication.

---

## Phase 8 — Catch-up progress (US-10)

### T-26 — Progress computation
- **Story:** US-10 — 3.3 Catch-up Progress
- **Depends on:** T-24
- **Status:** Blocked — needs decision

Compute completed vs. remaining overdue work. **[OQ]**
`OPEN_QUESTIONS.md` → progress measure (assignments vs. subtasks vs.
estimated hours). **Acceptance:** the ratio reflects exactly the completed
and remaining overdue units under the confirmed measure — no double-counting.

### T-27 — Progress indicator UI
- **Story:** US-10 — 3.3 Catch-up Progress
- **Depends on:** T-05, T-26
- **Status:** Not started

Visible indicator (e.g., progress bar). **Acceptance:** completing an overdue
item visibly moves the indicator; the displayed numbers match the underlying
data.

---

## Phase 9 — At-a-glance dashboard (US-08)

### T-28 — Dashboard aggregation endpoint
- **Story:** US-08 — 3.1 At-a-Glance Dashboard
- **Depends on:** T-13, T-22, T-26
- **Status:** Not started

Single response assembling today's tasks, overdue work, upcoming deadlines,
and progress. **Acceptance:** one request returns all four sections
consistent with their individual sources.

### T-29 — Dashboard UI with prominent add action
- **Story:** US-08 — 3.1 At-a-Glance Dashboard
- **Depends on:** T-10, T-28
- **Status:** Not started

Simple first screen per confirmed client priority. **Acceptance:** today's
tasks, overdue items, and upcoming deadlines appear on one screen with an
obvious add-assignment action that opens the entry form.

---

## Phase 10 — Deadline reminders (US-11)

### T-30 — Reminder scheduling and storage
- **Story:** US-11 — 3.4 Deadline Reminders
- **Depends on:** T-09
- **Status:** Blocked — needs decision

Derive reminders from upcoming due dates. **[OQ]** `OPEN_QUESTIONS.md` →
reminder channel and timing (in-app/email/push undecided; lead time
undecided). **Acceptance:** a reminder exists for each upcoming deadline per
the confirmed lead time — delivered through the confirmed channel.

### T-31 — Reminder display/configuration UI
- **Story:** US-11 — 3.4 Deadline Reminders
- **Depends on:** T-30
- **Status:** Not started

Surface reminders and any configurable options. **Acceptance:** a student can
see where an upcoming-deadline reminder appears (and configure it, if the
confirmed design allows) — sufficient for the V1 demo.

---

## Phase 11 — End-to-end V1 demonstration *(future goal, not part of scaffold)*

### T-32 — Demonstration walkthrough
- **Story:** all — spec §2.3 acceptance scenario
- **Depends on:** T-01 through T-31
- **Status:** Not started

One coherent catch-up scenario proving V1 scope. **Acceptance checklist:**

- [ ] Enter two or more assignments in distinct courses, including an
      overdue item, a future deadline, and estimated completion times.
- [ ] View assignments grouped by course and ranked by overdue status and
      due date.
- [ ] Optionally request a suggested subtask breakdown for a large
      assignment, then edit or dismiss the suggestions.
- [ ] Enter representative class, work, and personal commitments; build a
      weekly catch-up overview and inspect today's checklist.
- [ ] Mark a task complete and show the dashboard and backlog progress
      updating accordingly.
- [ ] Show where an upcoming-deadline reminder is displayed or configured
      (delivery mechanism per the confirmed decision).

*This demonstration is a later implementation goal. The current deliverable
is the scaffold and this plan — feature tasks are not yet implemented.*
