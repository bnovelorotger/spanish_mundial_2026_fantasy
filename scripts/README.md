# scripts

Standalone Node/TS scripts wired into `package.json`.

Expected files:

- `recalculate-points.ts` — Run `recalculateAllPoints()` from CLI (Phase 7).
- `sync-worldcup-data.ts` — Run a one-off sync locally (Phase 8).
- `seed.ts` — Optional helper to load seed SQL into Supabase (Phase 2/3).

Run with `pnpm <script>` — see root `package.json`.

Rules:

- Scripts read env from `.env.local`.
- Scripts may import server-only modules (`/lib/supabase/admin.ts`,
  `/lib/services/*`, `/lib/providers/*`).
- Scripts must exit with a non-zero code on failure.
