# lib/utils

Small, pure helper functions. No I/O, no Supabase imports.

Expected files:

- `locks.ts` — Pure lock-state logic that `locks.service.ts` wraps (Phase 6).
- `dates.ts` — Date formatting helpers (created when first needed).
- `cn.ts` — shadcn `cn()` className helper (added by shadcn init in Phase 1).

Rules:

- Pure functions only — easy to unit test.
- Do not import from `/lib/services` (avoid cycles).
