# lib/services

Business logic. UI components must call services, never raw Supabase queries.

Expected files (each created in its own phase):

- `matches.service.ts` — Read matches, build view models (Phase 5).
- `predictions.service.ts` — Save/read group predictions, server-side validation (Phase 6).
- `locks.service.ts` — Determine if a phase is locked (Phase 6).
- `scoring.service.ts` — Idempotent point recalculation (Phase 7).
- `ranking.service.ts` — Top-N, user position, breakdowns (Phase 7).
- `standings.service.ts` — Read/write `group_standings` (Phase 8).
- `sync.service.ts` — Orchestrate the provider → Supabase upsert cycle (Phase 8).
- `bracket.service.ts` — Knockout reads + prediction writes (Phase 9).

Rules:

- Named exports only.
- Validate inputs with Zod.
- Never call provider modules directly from the frontend.
- Pure functions where possible — easier to unit test.
