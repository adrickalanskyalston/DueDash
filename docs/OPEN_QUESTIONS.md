# DueDash — Open Questions

Unconfirmed decisions. Nothing on this page is client-approved. Items marked
*(spec)* come from Specification #1 (§1.3 usage contexts, §2.5 assumptions and
decisions to confirm); items marked *(builder)* are technical questions raised
during scaffolding.

## Product / behavior questions *(spec)*

- [ ] **Priority ties and manual reordering.** What is the exact tie-break
      rule when two assignments share a due date, and may students manually
      reorder items?
- [ ] **Smaller-step suggestion generation.** How are suggested steps
      produced, and what default steps fit different kinds of coursework?
      Note: AI generation is **not** assumed — templates, rules, or manual
      scaffolds are all candidate mechanisms.
- [ ] **Overbooked-time rule.** How should estimated tasks be fitted into
      available study blocks when there is more work than available time?
      (Spill to later days? Warn? Reprioritize?)
- [ ] **Progress measure.** Does the catch-up progress indicator count
      assignments, subtasks, or estimated work hours?
- [ ] **Reminder channel and timing.** In-app only, email, push, or a
      combination — and how early before a deadline are reminders sent?
- [ ] **Sign-in, persistence, privacy, device support.** What authentication
      (if any), data persistence scope, privacy expectations, and device
      matrix are required for v1?

## Platform & access *(spec §1.3 — undecided)*

- [ ] Confirm the proposed responsive web app as the platform — native
      iOS/Android apps have **not** been requested.
- [ ] Authentication method — none selected or approved.
- [ ] Data retention policy.
- [ ] Notification delivery mechanism (same as reminder channel above).
- [ ] Local/offline editing — currently **not** an approved requirement.

## Technical questions *(builder)*

- [ ] **Date and timezone handling.** How are due dates stored and compared —
      date-only vs. timestamp, user's local timezone, DST edge cases? What
      determines "overdue" and "today" for a student who travels or whose
      deadlines are in a course timezone?
- [ ] **Parent/subtask completion behavior.** Does completing all subtasks
      automatically complete the parent assignment? Does completing the
      parent cascade to its subtasks? Can a parent be marked complete while
      suggested subtasks remain incomplete, and how does that affect the
      progress count?
- [ ] **Persistence model for plans.** Are weekly plans / daily checklist
      items stored rows (`plan_items`) or computed on demand from
      assignments, estimates, and commitments? What happens to a stored plan
      when inputs change?
- [ ] **Supabase provisioning.** Who owns the project, which region, and when
      is it created? The scaffold deliberately runs without credentials.
- [ ] **Demo deployment target.** Local-only walkthrough vs. a hosted
      deployment for the V1 demonstration?
