# DueDash — Open Questions

Unconfirmed decisions. Nothing here is client-approved. (Spec §1.3, §2.5)

## From the specification

- [ ] Priority tie-break rule when two assignments share a due date; may
      students manually reorder items?
- [ ] How are suggested smaller steps generated, and what defaults fit
      different coursework types?
- [ ] Rule for fitting estimated tasks into available study blocks when there
      is more work than available time?
- [ ] Does the catch-up progress bar count assignments, subtasks, or estimated
      work hours?
- [ ] Reminder delivery: in-app only, email, push, or combination? How early?
- [ ] Sign-in, persistence, privacy, and device support for v1?

## Platform & access (spec §1.3 — undecided)

- [ ] Confirm responsive web app as the platform (native apps not requested).
- [ ] Authentication method.
- [ ] Data retention policy.
- [ ] Notification delivery mechanism.
- [ ] Is local/offline editing needed? (Currently not an approved requirement.)

## Builder-side (technical, to resolve before Phase 1)

- [ ] Supabase project provisioning — who owns it, which region?
- [ ] Auth: Supabase Auth vs. none for demo?
- [ ] Schema design for courses/assignments/subtasks/commitments/reminders.
- [ ] Deployment target for demo (local only vs. hosted)?
