-- ============================================================================
-- DueDash — Prototype 2 seed data (FICTIONAL ONLY — no real student data)
-- Run order: after db/01_schema.sql. Insert order follows FK dependencies:
--   students → courses → assignments → subtasks → commitments
--            → weekly_plans → plan_items → alerts
--
-- Coverage: 3 fictional students (isolation testing), archived course,
-- overdue / upcoming / completed work, both PlanItem target types
-- (assignment + subtask), recurring commitments, prior-week plan history,
-- a missed-plan alert, and a soft-deleted assignment.
--
-- Fixed UUIDs are used so FK references stay readable:
--   students 0001-0003  courses 0011-0014  assignments 0021-0025
--   subtasks 0031-0035  commitments 0041-0044  weekly_plans 0051-0054
--   plan_items 0061-0065  alerts 0071-0075
-- Dates are relative to now()/current_date so the seed stays meaningful.
-- ============================================================================

begin;

-- ---------------------------------------------------------------- students --
insert into students (student_id, display_name, email, time_zone) values
    ('00000000-0000-4000-8000-000000000001',
     'Jordan Lee',      'jordan.lee@example.edu',      'America/Chicago'),
    ('00000000-0000-4000-8000-000000000002',
     'Maya Rodriguez', 'maya.rodriguez@example.edu',  'America/New_York'),
    ('00000000-0000-4000-8000-000000000003',
     'Sam Chen',       'sam.chen@example.edu',        'America/Los_Angeles');

-- ----------------------------------------------------------------- courses --
insert into courses
    (course_id, student_id, course_name, course_number, semester,
     instructor_name, instructor_email, office_hours, is_archived, archived_at)
values
    ('00000000-0000-4000-8000-000000000011',
     '00000000-0000-4000-8000-000000000001',
     'Business Statistics', 'BUS 210', 'Fall 2026',
     'Dr. Priya Nair', 'pnair@example.edu', 'Tue 14:00-15:30',
     false, null),
    ('00000000-0000-4000-8000-000000000012',
     '00000000-0000-4000-8000-000000000001',
     'Intro to MIS', 'MIS 101', 'Spring 2026',   -- completed course, archived
     'Prof. Alan Grant', 'agrant@example.edu', null,
     true, now() - interval '30 days'),
    ('00000000-0000-4000-8000-000000000013',
     '00000000-0000-4000-8000-000000000002',
     'Marketing Analytics', 'MKT 410', 'Fall 2026',
     'Dr. Lena Ortiz', 'lortiz@example.edu', 'Wed 10:00-11:00',
     false, null),
    ('00000000-0000-4000-8000-000000000014',
     '00000000-0000-4000-8000-000000000003',
     'World History', 'HIS 101', 'Fall 2026',
     null, null, null, false, null);             -- optional fields unused

-- ------------------------------------------------------------- assignments --
insert into assignments
    (assignment_id, course_id, title, due_at, estimated_minutes,
     estimate_note, progress_state, completed_at, deleted_at)
values
    -- OVERDUE: past due, not complete → derived 'Overdue' (BR-04)
    ('00000000-0000-4000-8000-000000000021',
     '00000000-0000-4000-8000-000000000011',
     'Regression problem set', now() - interval '3 days', 240,
     'Harder than expected; revisit lecture 9', 'in_progress', null, null),
    -- COMPLETED: in archived course → historical record (BR-03, BR-10)
    ('00000000-0000-4000-8000-000000000022',
     '00000000-0000-4000-8000-000000000012',
     'Systems analysis report', now() - interval '40 days', 180,
     null, 'completed', now() - interval '35 days', null),
    -- UPCOMING
    ('00000000-0000-4000-8000-000000000023',
     '00000000-0000-4000-8000-000000000011',
     'Chapter 7 quiz prep', now() + interval '4 days', 60,
     null, 'not_started', null, null),
    -- UPCOMING with subtasks (US-04 target)
    ('00000000-0000-4000-8000-000000000024',
     '00000000-0000-4000-8000-000000000013',
     'Market research paper', now() + interval '10 days', 300,
     'Estimate assumes survey data arrives on time', 'in_progress', null, null),
    -- SOFT-DELETED: overdue work removed but retained for FK integrity (BR-09)
    ('00000000-0000-4000-8000-000000000025',
     '00000000-0000-4000-8000-000000000013',
     'Reading: consumer behavior', now() - interval '1 day', 45,
     null, 'not_started', null, now() - interval '12 hours');

-- ---------------------------------------------------------------- subtasks --
insert into subtasks
    (subtask_id, assignment_id, title, due_at, estimated_minutes,
     progress_state, sort_order, completed_at)
values
    ('00000000-0000-4000-8000-000000000031',
     '00000000-0000-4000-8000-000000000024',
     'Outline paper sections', null, 30,
     'completed', 1, now() - interval '5 days'),
    ('00000000-0000-4000-8000-000000000032',
     '00000000-0000-4000-8000-000000000024',
     'Collect survey data', now() + interval '3 days', 120,
     'in_progress', 2, null),                       -- optional subtask due date
    ('00000000-0000-4000-8000-000000000033',
     '00000000-0000-4000-8000-000000000024',
     'Draft findings section', now() + interval '7 days', 90,
     'not_started', 3, null),
    ('00000000-0000-4000-8000-000000000034',
     '00000000-0000-4000-8000-000000000024',
     'Edit and finalize', null, 45,
     'not_started', 4, null),
    ('00000000-0000-4000-8000-000000000035',
     '00000000-0000-4000-8000-000000000021',
     'Review lecture notes', null, 30,
     'not_started', 1, null);

-- ------------------------------------------------------------- commitments --
insert into commitments
    (commitment_id, student_id, kind, title, starts_at, ends_at,
     recurrence_rule)
values
    ('00000000-0000-4000-8000-000000000041',
     '00000000-0000-4000-8000-000000000001',
     'work', 'Bookstore shift',
     date_trunc('day', now()) + interval '2 days 17 hours',
     date_trunc('day', now()) + interval '2 days 21 hours',
     'FREQ=WEEKLY;BYDAY=TU,TH'),                     -- recurring (US-15)
    ('00000000-0000-4000-8000-000000000042',
     '00000000-0000-4000-8000-000000000001',
     'class', 'BUS 210 lecture',
     date_trunc('day', now()) + interval '3 days 10 hours',
     date_trunc('day', now()) + interval '3 days 11 hours 15 minutes',
     'FREQ=WEEKLY;BYDAY=MO,WE'),
    ('00000000-0000-4000-8000-000000000043',
     '00000000-0000-4000-8000-000000000002',
     'personal', 'Marketing club meeting',
     date_trunc('day', now()) + interval '5 days 18 hours',
     date_trunc('day', now()) + interval '5 days 20 hours',
     'FREQ=WEEKLY;BYDAY=FR'),
    ('00000000-0000-4000-8000-000000000044',
     '00000000-0000-4000-8000-000000000002',
     'personal', 'Dentist appointment',
     date_trunc('day', now()) + interval '6 days 9 hours',
     date_trunc('day', now()) + interval '6 days 10 hours',
     null);                                          -- one-off

-- ------------------------------------------------------------ weekly_plans --
insert into weekly_plans
    (weekly_plan_id, student_id, week_start, created_at, plan_state,
     archived_at)
values
    -- PRIOR WEEK, archived → plan history (BR-10)
    ('00000000-0000-4000-8000-000000000051',
     '00000000-0000-4000-8000-000000000001',
     date_trunc('week', current_date)::date - 7,
     now() - interval '8 days', 'archived', now() - interval '1 day'),
    ('00000000-0000-4000-8000-000000000052',
     '00000000-0000-4000-8000-000000000001',
     date_trunc('week', current_date)::date,
     now() - interval '1 day', 'current', null),
    ('00000000-0000-4000-8000-000000000053',
     '00000000-0000-4000-8000-000000000002',
     date_trunc('week', current_date)::date,
     now() - interval '1 day', 'current', null),
    ('00000000-0000-4000-8000-000000000054',
     '00000000-0000-4000-8000-000000000003',
     date_trunc('week', current_date)::date,
     now(), 'current', null);

-- -------------------------------------------------------------- plan_items --
insert into plan_items
    (plan_item_id, weekly_plan_id, assignment_id, subtask_id,
     planned_date, planned_minutes, sort_order)
values
    -- Prior-week item targeting an ASSIGNMENT; still incomplete → missed (BR-11)
    ('00000000-0000-4000-8000-000000000061',
     '00000000-0000-4000-8000-000000000051',
     '00000000-0000-4000-8000-000000000021', null,
     date_trunc('week', current_date)::date - 6, 120, 1),
    -- Prior-week item targeting a SUBTASK that was completed
    ('00000000-0000-4000-8000-000000000062',
     '00000000-0000-4000-8000-000000000051',
     null, '00000000-0000-4000-8000-000000000031',
     date_trunc('week', current_date)::date - 5, 45, 2),
    -- Current week, assignment target
    ('00000000-0000-4000-8000-000000000063',
     '00000000-0000-4000-8000-000000000052',
     '00000000-0000-4000-8000-000000000023', null,
     date_trunc('week', current_date)::date + 3, 90, 1),
    -- Current week, subtask target (second allowed target type)
    ('00000000-0000-4000-8000-000000000064',
     '00000000-0000-4000-8000-000000000052',
     null, '00000000-0000-4000-8000-000000000035',
     date_trunc('week', current_date)::date + 4, 60, 2),
    -- Maya's plan, assignment target
    ('00000000-0000-4000-8000-000000000065',
     '00000000-0000-4000-8000-000000000053',
     '00000000-0000-4000-8000-000000000024', null,
     date_trunc('week', current_date)::date + 3, 150, 1);

-- ------------------------------------------------------------------- alerts --
insert into alerts
    (alert_id, student_id, assignment_id, plan_item_id,
     alert_type, created_at, read_at, alert_state)
values
    ('00000000-0000-4000-8000-000000000071',
     '00000000-0000-4000-8000-000000000001',
     '00000000-0000-4000-8000-000000000023', null,
     'due_soon', now() - interval '6 hours', null, 'unread'),
    ('00000000-0000-4000-8000-000000000072',
     '00000000-0000-4000-8000-000000000001',
     '00000000-0000-4000-8000-000000000021', null,
     'overdue', now() - interval '1 day', null, 'unread'),
    -- MISSED-PLAN alert linked to the missed plan_item (BR-11)
    ('00000000-0000-4000-8000-000000000073',
     '00000000-0000-4000-8000-000000000001',
     '00000000-0000-4000-8000-000000000021',
     '00000000-0000-4000-8000-000000000061',
     'missed_plan', now() - interval '2 days', null, 'unread'),
    ('00000000-0000-4000-8000-000000000074',
     '00000000-0000-4000-8000-000000000002',
     '00000000-0000-4000-8000-000000000024', null,
     'due_soon', now() - interval '2 days', now() - interval '1 day', 'read'),
    ('00000000-0000-4000-8000-000000000075',
     '00000000-0000-4000-8000-000000000001',
     '00000000-0000-4000-8000-000000000021', null,
     'overdue', now() - interval '3 days', now() - interval '2 days',
     'dismissed');

commit;
