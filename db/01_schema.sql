-- ============================================================================
-- DueDash — Prototype 2 database schema
-- Source: Level 2 Specification §3.4 (data schema), §3.3 (BR-01..BR-12),
--         §3.5 (integrity rules); cross-checked against the Level 2 ERD.
--
-- ENTITY → TABLE MAPPING (for grader):
--   Analyst name  → physical table      (plural snake_case per repo rules)
--   Student       → students
--   Course        → courses
--   Assignment    → assignments
--   Subtask       → subtasks
--   Commitment    → commitments
--   WeeklyPlan    → weekly_plans
--   PlanItem      → plan_items
--   Alert         → alerts
--
-- TYPE MAPPING (spec "suggested types" → PostgreSQL/Supabase):
--   UUID          → uuid (gen_random_uuid())
--   timestamp     → timestamptz  (spec leaves time-zone policy open;
--                                 timestamptz stores an instant safely)
--   date          → date
--   string        → text
--   integer       → integer
--   boolean       → boolean
--   enum          → text + CHECK constraint (allowed values listed inline)
--   "?"           → nullable column; all others are NOT NULL
--
-- HISTORY / DELETION MODEL (BR-03, BR-09, BR-10, §3.5):
--   Courses archive via is_archived/archived_at instead of being deleted.
--   Assignments/subtasks use reversible soft deletion (deleted_at) so child
--   and plan-item foreign keys are preserved; FKs are declared without
--   CASCADE so physical deletes cannot silently orphan history.
--   Prior weekly_plans/plan_items are retained via plan_state='archived'.
--
-- DERIVED DATA (BR-04, §3.5):
--   'Overdue' is never stored; it is computed in view assignment_display
--   from due_at + incomplete progress_state.
-- ============================================================================

create extension if not exists pgcrypto;

drop view  if exists assignment_display;
drop table if exists alerts       cascade;
drop table if exists plan_items   cascade;
drop table if exists weekly_plans cascade;
drop table if exists commitments  cascade;
drop table if exists subtasks     cascade;
drop table if exists assignments  cascade;
drop table if exists courses      cascade;
drop table if exists students     cascade;
drop function if exists plan_item_owner_matches();
drop function if exists alert_owner_matches();

-- ---------------------------------------------------------------------------
-- Student — logical owner of all private academic data (BR-12).
-- ---------------------------------------------------------------------------
create table students (
    student_id   uuid        primary key default gen_random_uuid(),
    display_name text        not null,
    email        text        not null unique,      -- unique if accounts approved
    time_zone    text        not null,             -- policy open (spec §3.5)
    created_at   timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Course — belongs to exactly one Student (BR-01); archived, not deleted
-- (BR-03). Instructor fields optional descriptive data (BR-02).
-- ---------------------------------------------------------------------------
create table courses (
    course_id        uuid        primary key default gen_random_uuid(),
    student_id       uuid        not null references students(student_id),
    course_name      text        not null,
    course_number    text        not null,         -- required per Interview 2
    semester         text        not null,
    instructor_name  text,
    instructor_email text,
    office_hours     text,
    is_archived      boolean     not null default false,
    archived_at      timestamptz,
    check (is_archived = false or archived_at is not null)
);

-- ---------------------------------------------------------------------------
-- Assignment — belongs to exactly one Course (BR-01, no orphan "personal"
-- tasks). Overdue is derived, not stored (BR-04). Soft delete via deleted_at
-- (BR-09). Estimates nonnegative and editable (BR-05).
-- ---------------------------------------------------------------------------
create table assignments (
    assignment_id      uuid        primary key default gen_random_uuid(),
    course_id          uuid        not null references courses(course_id),
    title              text        not null,
    due_at             timestamptz not null,       -- tz details open (spec §3.5)
    estimated_minutes  integer     not null check (estimated_minutes >= 0),
    estimate_note      text,
    progress_state     text        not null default 'not_started'
                       check (progress_state in
                              ('not_started', 'in_progress', 'completed')),
    completed_at       timestamptz,
    deleted_at         timestamptz,
    check (progress_state <> 'completed' or completed_at is not null)
);

create index assignments_course_id_idx on assignments(course_id);

-- ---------------------------------------------------------------------------
-- Subtask — belongs to exactly one Assignment (BR-06); due dates optional.
-- ---------------------------------------------------------------------------
create table subtasks (
    subtask_id         uuid        primary key default gen_random_uuid(),
    assignment_id      uuid        not null references assignments(assignment_id),
    title              text        not null,
    due_at             timestamptz,                -- optional deadline (US-14)
    estimated_minutes  integer     check (estimated_minutes is null
                                          or estimated_minutes >= 0),
    progress_state     text        not null default 'not_started'
                       check (progress_state in
                              ('not_started', 'in_progress', 'completed')),
    sort_order         integer     not null default 0,
    completed_at       timestamptz,
    deleted_at         timestamptz,
    check (progress_state <> 'completed' or completed_at is not null)
);

create index subtasks_assignment_id_idx on subtasks(assignment_id);

-- ---------------------------------------------------------------------------
-- Commitment — unavailable blocks only; never auto-books study time (BR-07).
-- ends_at must be later than starts_at. recurrence_rule is optional text
-- (RFC-5545-style RRULE string); exception handling open.
-- ---------------------------------------------------------------------------
create table commitments (
    commitment_id   uuid        primary key default gen_random_uuid(),
    student_id      uuid        not null references students(student_id),
    kind            text        not null
                    check (kind in ('class', 'work', 'personal')),
    title           text        not null,
    starts_at       timestamptz not null,
    ends_at         timestamptz not null check (ends_at > starts_at),
    recurrence_rule text
);

create index commitments_student_id_idx on commitments(student_id);

-- ---------------------------------------------------------------------------
-- WeeklyPlan — one stored plan per student per week; retained for history
-- (BR-08, BR-10). plan_state: draft / current / archived.
-- ---------------------------------------------------------------------------
create table weekly_plans (
    weekly_plan_id uuid        primary key default gen_random_uuid(),
    student_id     uuid        not null references students(student_id),
    week_start     date        not null,           -- beginning of plan week
    created_at     timestamptz not null default now(),
    plan_state     text        not null default 'draft'
                   check (plan_state in ('draft', 'current', 'archived')),
    archived_at    timestamptz,
    check (plan_state <> 'archived' or archived_at is not null)
);

create index weekly_plans_student_id_idx on weekly_plans(student_id);

-- ---------------------------------------------------------------------------
-- PlanItem — dated item inside a WeeklyPlan (BR-08).
-- Targets exactly one Assignment or one Subtask, never both (exclusive
-- reference); ownership must match the plan's student — enforced by trigger.
-- ---------------------------------------------------------------------------
create table plan_items (
    plan_item_id    uuid    primary key default gen_random_uuid(),
    weekly_plan_id  uuid    not null references weekly_plans(weekly_plan_id),
    assignment_id   uuid    references assignments(assignment_id),
    subtask_id      uuid    references subtasks(subtask_id),
    planned_date    date    not null,
    planned_minutes integer not null check (planned_minutes >= 0),
    sort_order      integer not null default 0,
    check ((assignment_id is not null)::int
         + (subtask_id    is not null)::int = 1)
);

create index plan_items_weekly_plan_id_idx on plan_items(weekly_plan_id);
create index plan_items_assignment_id_idx  on plan_items(assignment_id);
create index plan_items_subtask_id_idx     on plan_items(subtask_id);

-- ---------------------------------------------------------------------------
-- Ownership trigger: PlanItem's target work must belong to the same student
-- as its WeeklyPlan (BR-08/BR-12, §3.5). Path to owner:
--   assignment → course → student_id
--   subtask    → assignment → course → student_id
-- Missing FK targets are skipped here so the FK constraint reports the real
-- error instead of a misleading ownership message.
-- ---------------------------------------------------------------------------
create or replace function plan_item_owner_matches()
returns trigger language plpgsql as $$
declare
    v_plan_student uuid;
    v_work_student uuid;
begin
    select student_id into v_plan_student
      from weekly_plans where weekly_plan_id = new.weekly_plan_id;

    if new.assignment_id is not null then
        select c.student_id into v_work_student
          from assignments a
          join courses c on c.course_id = a.course_id
         where a.assignment_id = new.assignment_id;
    else
        select c.student_id into v_work_student
          from subtasks s
          join assignments a on a.assignment_id = s.assignment_id
          join courses c on c.course_id = a.course_id
         where s.subtask_id = new.subtask_id;
    end if;

    if v_work_student is null then
        return new;                     -- let the FK constraint report it
    end if;

    if v_work_student <> v_plan_student then
        raise exception
            'plan_item target belongs to a different student (BR-08/BR-12)';
    end if;
    return new;
end $$;

create trigger plan_items_owner_check
    before insert or update on plan_items
    for each row execute function plan_item_owner_matches();

-- ---------------------------------------------------------------------------
-- Alert — reminders and missed-work prompts (BR-11). Types:
--   due_soon | overdue | missed_plan
-- States: unread | read | dismissed.
-- assignment_id and plan_item_id are optional links; when present they must
-- belong to alert.student_id (enforced by trigger below).
-- ---------------------------------------------------------------------------
create table alerts (
    alert_id      uuid        primary key default gen_random_uuid(),
    student_id    uuid        not null references students(student_id),
    assignment_id uuid        references assignments(assignment_id),
    plan_item_id  uuid        references plan_items(plan_item_id),
    alert_type    text        not null
                  check (alert_type in ('due_soon', 'overdue', 'missed_plan')),
    created_at    timestamptz not null default now(),
    read_at       timestamptz,
    alert_state   text        not null default 'unread'
                  check (alert_state in ('unread', 'read', 'dismissed'))
);

create index alerts_student_id_idx on alerts(student_id);

create or replace function alert_owner_matches()
returns trigger language plpgsql as $$
declare
    v_student uuid;
begin
    if new.assignment_id is not null then
        select c.student_id into v_student
          from assignments a
          join courses c on c.course_id = a.course_id
         where a.assignment_id = new.assignment_id;
        if v_student is not null and v_student <> new.student_id then
            raise exception
                'alert.assignment_id belongs to a different student (BR-12)';
        end if;
    end if;

    if new.plan_item_id is not null then
        select wp.student_id into v_student
          from plan_items pi
          join weekly_plans wp on wp.weekly_plan_id = pi.weekly_plan_id
         where pi.plan_item_id = new.plan_item_id;
        if v_student is not null and v_student <> new.student_id then
            raise exception
                'alert.plan_item_id belongs to a different student (BR-12)';
        end if;
    end if;

    return new;
end $$;

create trigger alerts_owner_check
    before insert or update on alerts
    for each row execute function alert_owner_matches();

-- ---------------------------------------------------------------------------
-- Derived display status (BR-04): 'Overdue' is computed for incomplete work
-- past due_at; never stored, so it cannot go stale. Soft-deleted rows are
-- excluded from the visible view but retained (BR-09/BR-10).
-- ---------------------------------------------------------------------------
create view assignment_display as
select
    a.assignment_id,
    a.course_id,
    c.student_id,
    a.title,
    a.due_at,
    a.estimated_minutes,
    a.estimate_note,
    a.progress_state,
    a.completed_at,
    case
        when a.progress_state = 'completed' then 'Completed'
        when a.due_at < now()               then 'Overdue'
        when a.progress_state = 'in_progress' then 'In Progress'
        else 'Not Started'
    end as display_state
from assignments a
join courses c on c.course_id = a.course_id
where a.deleted_at is null;
