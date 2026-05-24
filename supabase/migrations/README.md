# supabase/migrations

Ordered SQL migrations. Filenames must be lexicographically ordered.

Expected files (Phase 2):

- `001_initial_schema.sql` — All 11 tables, indexes, constraints.
- `002_rls.sql` — Enable RLS and add policies.

Add new migrations as `003_*`, `004_*`, etc. **Never edit a committed migration**
— write a new one.

Rules:

- Deterministic SQL only — no random data, no time-dependent values.
- Use `gen_random_uuid()` for default PKs.
- Use `timestamptz` everywhere.
- Idempotency-critical unique constraints go in `001_initial_schema.sql`
  (see [docs/DATABASE_SCHEMA.md](../../docs/DATABASE_SCHEMA.md)).
