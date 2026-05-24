# supabase/seed

Repeatable seed SQL for local development and tests.

Expected files (Phase 2):

- `seed_teams.sql` — All 12 groups (A-L) with placeholder/TBD teams where the
  real qualifier is not yet known.
- `seed_matches_mock.sql` — Enough group-stage and a few knockout matches to
  exercise the calendar, predictions, and scoring flows.
- `seed_standings_mock.sql` *(optional)* — Sample finalised standings so scoring
  tests have something to score against.

Rules:

- Seeds must be safe to run twice (use `INSERT ... ON CONFLICT DO NOTHING` or
  truncate inside a transaction).
- Seeds never reference real users — only `auth.users` placeholders are
  forbidden here.
