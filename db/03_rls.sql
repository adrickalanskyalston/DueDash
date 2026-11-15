-- ===========================================================================
-- 03_rls.sql — DueDash Prototype 2: row-level security + permissions
-- Run AFTER 01_schema.sql and 02_seed.sql in the hosted SQL Editor.
--
-- Posture: the Express API uses the service role key (server-side only).
-- RLS is enabled on all eight tables; only service_role may touch data.
-- anon/authenticated get nothing — per-user policies are deferred until
-- authentication is decided (docs/OPEN_QUESTIONS.md).
-- Safe to re-run (idempotent).
-- ===========================================================================

-- 1) Enable RLS on all eight DueDash tables -------------------------------
alter table public.students       enable row level security;
alter table public.courses        enable row level security;
alter table public.assignments    enable row level security;
alter table public.subtasks       enable row level security;
alter table public.commitments    enable row level security;
alter table public.weekly_plans   enable row level security;
alter table public.plan_items     enable row level security;
alter table public.alerts         enable row level security;

-- 2) service_role policies — the Express API's access path -----------------
-- (The service key already bypasses RLS; these policies make the intended
-- access explicit and keep it working if the bypass ever changes.)
do $$
declare
  t text;
begin
  foreach t in array array[
    'students','courses','assignments','subtasks',
    'commitments','weekly_plans','plan_items','alerts'
  ] loop
    execute format('drop policy if exists service_role_all on public.%I', t);
    execute format(
      'create policy service_role_all on public.%I
         for all to service_role using (true) with check (true)', t);
    execute format(
      'revoke all on table public.%I from anon, authenticated', t);
    execute format(
      'grant select, insert, update, delete on table public.%I to service_role', t);
  end loop;
end $$;

-- 3) assignment_display view — service role only ---------------------------
-- Supabase views run as their owner (definer) by default; switching to
-- security_invoker makes the view honour the caller's grants/RLS, so only
-- roles that can read the base tables can read it.
alter view public.assignment_display set (security_invoker = true);
revoke all on public.assignment_display from anon, authenticated;
grant select on public.assignment_display to service_role;

-- Verification:
--   select tablename, rowsecurity from pg_tables where schemaname='public';
--   -- expect rowsecurity = true on all 8 tables
--   select policyname, tablename from pg_policies where schemaname='public';
--   -- expect service_role_all on all 8 tables
