# DueDash — Product Requirements Document

**Source:** "Specification 1 - Zagreb.pdf" — Level 1 Specification #1,
Strategy & Scope (MINS 350, October 25, 2026).
**Client / sponsor:** Chamia Cross-Caffey. **Systems analyst:** Tyler Winslow.
**Requirements basis:** client RFP (9/27), baseline plan (10/11), client
interview transcript.

This document separates three kinds of statements:

- **[Confirmed]** — stated in the specification or confirmed by the client.
- **[Proposed]** — Builder technical choices, not client-approved requirements.
- **[Open]** — decisions awaiting confirmation (see `OPEN_QUESTIONS.md`).

---

## 1. Project Title and Description

**DueDash** — a private student planning application that helps college
students who are **already behind** on coursework build a realistic catch-up
plan. **[Confirmed]**

Unlike a calendar that only displays due dates, DueDash helps students enter
schoolwork, identify overdue and upcoming assignments, prioritize deadlines,
and translate a backlog into manageable weekly and daily work. It reduces the
uncertainty of deciding where to start. It does **not** submit, grade, or
complete academic work, and it complements — rather than replaces — Canvas and
Google Calendar. **[Confirmed]**

## 2. Problem Statement

Students who fall behind face a backlog spread across an LMS, calendars, and
reminders, with no recovery strategy. Calendars show *when* work is due but not
*how* to catch up. The result is overwhelm: students can't tell what to tackle
first, how long it will take, or whether catching up is even feasible alongside
work shifts, classes, and personal commitments. **[Confirmed]**

## 3. Target Users

- **Working college students** — e.g., *Jordan Lee*, 20, Business
  Administration junior working ~20 hours/week. Needs overdue visibility,
  due-date prioritization, scheduling around shifts, splitting large work into
  smaller tasks, and a view of what's finished. Pain points: scattered
  responsibilities, unpredictable work weeks, uncertain time estimates, an
  overwhelming backlog. **[Confirmed]**
- **Students balancing classes with other commitments** — e.g., *Maya
  Rodriguez*, 22, Marketing senior with a full course load and student
  organizations. Needs course organization, a weekly plan, management of
  overlapping deadlines, reminders, and progress monitoring. Pain points: busy
  weeks colliding, large projects that are hard to start, calendars without a
  recovery strategy. **[Confirmed]**
- **Secondary usage situation** — a currently caught-up student using DueDash
  for upcoming deadlines and reminders. This is a mode of use, not a separate
  confirmed persona. **[Confirmed]**

## 4. Product Priority

**Catching up first; prevention second.** Overdue prioritization and catch-up
planning define the core flow. Reminders exist to help students *stay* caught
up once the backlog is cleared — they are useful but explicitly secondary.
**[Confirmed]**

## 5. Selected Phase 1 User Stories (US-01 … US-11)

All eleven stories, verbatim from the specification, mapped to their feature
modules. **[Confirmed]**

| ID | Module | User story |
| -- | ------ | ---------- |
| US-01 | 1.1 Course Organization | "As a college student, I want to create course labels and organize assignments by class so that I can understand my workload for each course." |
| US-02 | 1.2 Assignment Entry & Editing | "As a busy college student, I want to add or update an assignment with its name, course, due date, and estimated completion time so that DueDash has the information needed to plan my work." |
| US-03 | 1.3 Deadline Prioritization | "As a college student who has fallen behind, I want DueDash to prioritize assignments by overdue status and due date so that I know which work needs attention first." |
| US-04 | 2.1 Optional Task Breakdown | "As a student facing a large assignment, I want to request suggested smaller steps and edit or decline them so that I can start work using a plan that fits me." |
| US-05 | 2.2 Availability & Commitments | "As a working college student, I want to enter my class schedule, work shifts, and personal commitments so that catch-up planning accounts for times when I am unavailable." |
| US-06 | 2.3 Weekly Catch-up Plan | "As a student with overdue work, I want to build a suggested weekly catch-up plan from deadlines, task estimates, and my availability so that I can spread work across manageable days." |
| US-07 | 2.4 Daily Checklist & Time Estimates | "As a college student, I want to view a daily checklist of planned tasks with estimated durations so that I know what to work on today and how long it may take." |
| US-08 | 3.1 At-a-Glance Dashboard | "As a college student juggling several courses, I want to see today's tasks, overdue assignments, and upcoming deadlines on one dashboard so that I can quickly understand my workload." |
| US-09 | 3.2 Completion Tracking | "As a college student, I want to mark an assignment or its smaller tasks complete so that my remaining work stays accurate as I make progress." |
| US-10 | 3.3 Catch-up Progress | "As a student catching up on overdue work, I want to see completed versus remaining overdue tasks so that I can tell how much of my backlog I have cleared." |
| US-11 | 3.4 Deadline Reminders | "As a college student, I want reminders about approaching assignment due dates so that I can avoid falling behind again once I catch up." |

18 additional drafted stories (US-12 … US-29) were reviewed and rejected —
out of scope, deferred integrations, conflicts with client intent, vague,
redundant, or implementation-only. They remain documented in the source
specification.

## 6. Scope Boundaries

### 6.1 Explicitly excluded **[Confirmed]**

- Assignment submission to an LMS and grading of any kind
- Completing homework or academic work for the student
- Tutoring / academic help matching
- Payments, tuition, financial aid, or any financial transactions
- Official university records, transcripts, or administrative functions
- Public social networking: feeds, comments, leaderboards

### 6.2 Deferred — not approved for Phase 1 **[Confirmed]**

- Canvas (LMS) import of assignments
- Google Calendar or other two-way calendar synchronization
- OCR / photo capture of paper assignments
- Other third-party integrations

"Deferred" means proposed for later consideration — it is **not** client-
approved future work.

### 6.3 Not assumed

- Smaller-step suggestions do **not** require AI generation; the mechanism
  (templates, rules, or otherwise) is undecided. **[Open]**
- Local/offline editing is **not** an approved requirement. **[Confirmed]**
- Native iOS/Android apps have not been requested; the responsive web platform
  itself requires confirmation. **[Open]**
- No authentication method has been selected or approved. **[Open]**

## 7. Proposed Technical Architecture

Everything in this section is **[Proposed]** — Builder choices for the
scaffold, not client-confirmed requirements.

### 7.1 Components and responsibilities

```
┌─────────────────────────┐      HTTPS/JSON       ┌─────────────────────────┐
│  React + Vite client    │ ────────────────────► │  Node.js + Express API  │
│  (client/, JavaScript)  │ ◄──────────────────── │  (api/)                 │
│  Responsive web UI for  │      JSON responses   │  REST endpoints,        │
│  laptops + smartphones  │                       │  prioritization &       │
└─────────────────────────┘                       │  planning logic         │
                                                  └───────────┬─────────────┘
                                                              │
                                                              ▼
                                                  ┌─────────────────────────┐
                                                  │  Supabase PostgreSQL    │
                                                  │  (planned; migrations/  │
                                                  │  + seeds/ placeholders) │
                                                  └─────────────────────────┘
```

- **Frontend — React + Vite (JavaScript):** single-page responsive UI;
  dashboard, assignment/commitment entry forms, weekly plan and daily
  checklist views. Calls the Express API over HTTP; holds no business data of
  its own.
- **Backend — Node.js + Express:** REST API exposing resources for courses,
  assignments, subtasks, commitments, plans, and reminders. Owns the
  prioritization and catch-up planning rules (overdue-first ordering, weekly
  distribution, progress computation) so the client stays thin.
- **Database — Supabase PostgreSQL:** persistence for all user data. SQL
  migrations live in `supabase/migrations/`, seed data in `supabase/seeds/`.
  Not yet provisioned; the scaffold runs without credentials.

### 7.2 Planned data flow

1. Student enters courses, assignments (name, course, due date, estimated
   time), and commitments through the client.
2. Client sends REST calls to the Express API; the API validates and persists
   rows in Supabase.
3. On dashboard/plan requests, the API computes derived views — overdue
   status, priority ordering, weekly distribution, daily checklist, catch-up
   progress — and returns them as JSON. (Computation vs. materialization is a
   design decision, see `OPEN_QUESTIONS.md`.)
4. Completion updates flow back through the API, which recomputes remaining
   work and progress.
5. Reminders are generated from due dates; delivery channel and timing are
   **[Open]**.

### 7.3 Preliminary data model — proposal only

**Not a finalized schema.** A starting point for Phase 1 discussion; field
names, constraints, and whether planning output is stored or computed are all
to be decided.

| Table (proposed) | Purpose | Candidate fields |
| ---------------- | ------- | ---------------- |
| `courses` | Course labels (US-01) | `id`, `name`, `color?`, `created_at` |
| `assignments` | Assignment records (US-02, US-03) | `id`, `course_id`, `name`, `due_at`, `estimated_minutes`, `status` (`pending`/`complete`), `created_at` |
| `assignment_steps` | Optional smaller steps (US-04) | `id`, `assignment_id`, `title`, `estimated_minutes`, `status`, `position`, `source` (`suggested`/`manual`) |
| `commitments` | Class/work/personal blocks (US-05) | `id`, `kind`, `title`, `starts_at`, `ends_at`, `recurrence?` |
| `plan_items` | Persisted daily/weekly plan entries (US-06, US-07) — *or computed on the fly; TBD* | `id`, `assignment_id`/`step_id`, `planned_date`, `planned_minutes` |
| `reminders` | Deadline reminders (US-11) | `id`, `assignment_id`, `remind_at`, `channel`, `status` |

Cross-cutting fields such as `user_id` are omitted until the authentication
decision is made. No tables have been created; `supabase/migrations/` is an
empty placeholder.

## 8. First-Version Demonstration of Success

Per spec §2.3, the Builder should walk through one coherent catch-up scenario:
**[Confirmed]**

1. Enter two or more assignments in distinct courses, including an overdue
   item, a future deadline, and estimated completion times.
2. View the assignments grouped by course and ranked by overdue status and due
   date.
3. Optionally request a suggested subtask breakdown for a large assignment,
   then edit or dismiss the suggestions.
4. Enter representative class, work, and personal commitments; build a weekly
   catch-up overview and inspect today's checklist.
5. Mark a task complete and show the dashboard and backlog progress updating
   accordingly.
6. Show where an upcoming-deadline reminder is displayed or configured (final
   delivery mechanism to be confirmed).

## 9. Assumptions and Unresolved Decisions

### 9.1 Assumptions held for scope planning **[Confirmed — assumed, not approved]**

- Intermittent campus/home Wi-Fi or mobile connectivity.
- Personal rather than shared devices.
- Quick entry while multitasking; brief on-the-go check-ins.
- Assignment, schedule, and reminder data are personal to the student.

### 9.2 Unresolved decisions **[Open]**

All items in `docs/OPEN_QUESTIONS.md`, including: priority tie-breaks and
manual reordering; how smaller-step suggestions are generated; overbooked-time
rules; what the progress indicator counts; reminder channel and timing;
sign-in, persistence, privacy, and device support; timezone handling; and
parent/subtask completion behavior. These are open design questions — nothing
here asserts a client-approved answer.

---

*Scaffold-stage document. Describes intended V1 functionality; does not
define a final interface or engineering architecture. Features are not yet
implemented.*
