# DueDash — Product Requirements (Scaffold Draft)

Source: "Specification 1 - Zagreb.pdf" (MINS 350, October 25, 2026).
Client/sponsor: Chamia Cross-Caffey. Analyst/author: Tyler Winslow.

## Summary

DueDash is a private student planning application for college students who are
**already behind** on coursework and need a realistic way to catch up. Catching
up is the primary goal; preventing future late work (reminders) is secondary.
It complements Canvas and Google Calendar rather than replacing them, and it
does not submit, grade, or complete academic work.

## Users

- **Jordan Lee** — working student (Business Administration junior, ~20 work
  hours/week). Needs overdue visibility, prioritization, and scheduling around
  shifts.
- **Maya Rodriguez** — involved student (Marketing senior, full course load +
  clubs). Needs course organization, weekly planning, overlapping-deadline
  management, reminders, and progress tracking.
- Secondary mode: a caught-up student using DueDash for upcoming deadlines and
  reminders.

## V1 Feature Modules (from spec §2.1.1)

| Module | Function |
| ------ | -------- |
| 1.1 Course Organization | Course labels; group assignments by course. |
| 1.2 Assignment Entry & Editing | Name, course, due date, estimated time; mark overdue. |
| 1.3 Deadline Prioritization | Order by overdue status and due date; editable estimates. |
| 2.1 Optional Task Breakdown | Suggested smaller steps; student may edit, keep, or ignore. |
| 2.2 Availability & Commitments | Record class, work, personal commitments. |
| 2.3 Weekly Catch-up Plan | Suggested distribution of work across the week. |
| 2.4 Daily Checklist | Today's planned tasks with estimated durations. |
| 3.1 At-a-Glance Dashboard | Today, overdue, upcoming, prominent add-assignment action. |
| 3.2 Completion Tracking | Mark tasks/subtasks complete. |
| 3.3 Catch-up Progress | Completed vs. remaining overdue indicator. |
| 3.4 Deadline Reminders | Notifications of upcoming due dates (channel TBD). |

## Scope Boundaries

Out of scope: assignment submission/grading, payments/financial aid, tutoring,
homework completion, university records/administration, public social features.
Deferred (not approved for V1): Canvas import, Google Calendar sync, OCR
capture, other third-party integrations.

## Builder Technical Choices (not client-confirmed)

These are implementation choices made for the scaffold, not requirements
approved by the client:

- **Frontend:** React + Vite (JavaScript), responsive for laptop and phone.
- **Backend:** Node.js + Express.
- **Planned database:** Supabase PostgreSQL (migrations/seeds under `supabase/`).
- **Platform:** responsive web app. Native iOS/Android not requested; platform
  choice still requires confirmation.

## V1 Demonstration of Success (spec §2.3)

Walk through one coherent catch-up scenario: enter assignments in distinct
courses (including an overdue item), view them grouped and ranked, optionally
request/edit a subtask breakdown, enter commitments, build a weekly plan,
inspect today's checklist, mark a task complete, and show progress updating —
plus where reminders are displayed/configured.
