# Supabase

Planned database: Supabase PostgreSQL (a Builder technical choice, not yet
client-confirmed).

- `migrations/` — SQL migration files, applied in filename order
  (e.g. `0001_init.sql`). Empty until Phase 1 schema work begins.
- `seeds/` — seed data for local development. Empty for now.

No Supabase project has been provisioned yet, and the scaffold runs without
credentials. When a project exists, put keys in `api/.env` (never commit it —
see `api/.env.example`).
