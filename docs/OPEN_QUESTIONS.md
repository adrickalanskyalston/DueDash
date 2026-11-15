# DueDash — Open Questions

Unconfirmed decisions. Nothing on this page is client-approved unless marked
resolved. Items marked *(spec)* come from Specification #1 / Level 2;
items marked *(builder)* are technical questions raised during scaffolding.

**Updated for Level 2 spec (Nov 2026):** its §3.5 "Design decisions
remaining open" is the current authority; items it resolves are marked below.

## Resolved by Level 2 spec

- [x] **Plan persistence model.** → **Stored.** `weekly_plans`/`plan_items`
      are real tables; prior plans retained (`plan_state='archived'`) for
      history (BR-08/BR-10). Implemented in `db/01_schema.sql`.
- [x] **Overdue definition.** → **Derived**, never stored: incomplete work
      past `due_at` (BR-04). Implemented as view `assignment_display`.
- [x] **Supabase provisioning (this phase).** → Hosted test project
      designated by the student; API connects via `SUPABASE_URL` +
      `SUPABASE_ANON_KEY` env vars.
- [x] **Historical course data.** → Courses archive
      (`is_archived`/`archived_at`), never hard-delete (BR-03, US-12).
- [x] **Deletion model.** → Reversible soft delete (`deleted_at`) preserving
      FKs (BR-09, US-16).

## Product / behavior questions *(still open per Level 2 §3.5)*

- [ ] **Priority ties and manual reordering.** Overdue-before-upcoming is
      approved; tie breaks and student reordering still open.
- [ ] **Smaller-step suggestion generation.** User may request and edit;
      mechanism (rule/template/AI) **not approved** — do not assume AI.
- [ ] **Overbooked-time rule.** Client opposes automatic study-slot booking;
      confirm how the plan handles more work than available time.
- [ ] **Progress measure.** Assignments vs. subtasks vs. estimated hours —
      unconfirmed.
- [ ] **Reminder delivery.** Channel, timing, and dismissal policy open;
      alerts must distinguish missed-plan from due-soon (BR-11).
- [ ] **Sign-in, privacy, account email.** Authentication, email policy,
      and storage isolation — unapproved (BR-12).
- [ ] **Parent/subtask completion.** Cascading vs. independent completion —
      open (BR-06).
- [ ] **Recurrence exceptions.** Recurring commitments approved (US-15);
      one-off override handling unspecified.

## Platform & access *(undecided)*

- [ ] Confirm the proposed responsive web app as the platform — native
      iOS/Android apps have **not** been requested.
- [ ] Data retention policy.
- [ ] Local/offline editing — currently **not** an approved requirement.

## Technical questions *(builder)*

- [ ] **Date and timezone handling.** *Partially resolved:* `due_at` stored
      as `timestamptz`; `Student.time_zone` column exists. Still open: which
      timezone defines "today"/"overdue" for display, and DST edges.
- [ ] **Row Level Security.** Tables are unprotected at the DB layer until
      auth is chosen — anon key can read all rows. Acceptable for the
      disposable test project; must be revisited before real data (BR-12).
- [ ] **Demo deployment target.** Local-only walkthrough vs. a hosted
      deployment for the V1 demonstration?
