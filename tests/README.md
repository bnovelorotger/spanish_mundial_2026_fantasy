# tests

Unit and integration tests, run by Vitest.

Co-location is allowed: `lib/services/scoring.service.test.ts` next to its
source file is fine. This folder is for tests that don't have a single owning
module (helpers, fixtures, integration scenarios).

Expected files (added as phases land):

- `scoring.service.test.ts` — exact / top-2 wrong order / best-third / idempotency (Phase 7).
- `ranking.service.test.ts` — tie-break ordering (Phase 7).
- `locks.test.ts` — phase lock derivation (Phase 6).
- `bracket.service.test.ts` — knockout prediction validation (Phase 9).
- `providers.fallback.test.ts` — provider chain fallback (Phase 11).

Rules:

- Vitest only — no Jest, no Mocha.
- No real network calls. Mock providers and Supabase at the service boundary.
- Tests must pass in `pnpm test` before any phase is considered done.
