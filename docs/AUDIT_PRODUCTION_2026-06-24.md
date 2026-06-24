# Production Audit 2026-06-24

## 1. Executive summary

Estado general: **apta para despliegue con una acción pendiente clara**.

- El trabajo local de knockout v1 en dos ventanas está verificado con `pnpm test`, `pnpm lint` y `pnpm build`.
- He detectado un fallo real en producción actual: el cron `Sync World Cup Data` falló el `24 de junio de 2026 a las 18:27:05 UTC`.
- La causa visible fue `matches_status_scores_check` durante el `upsert` de `matches`.
- El árbol local ya incluye una defensa para no abortar el sync entero ante payloads transitorios inconsistentes del provider.
- La feature knockout **no está todavía activa en producción actual** porque requiere desplegar este commit y aplicar la migración `007_knockout_windows_and_slots.sql`.

## 2. Current production health

Evidence gathered:

- Branch local actual: `main`
- GitHub auth: `gh auth status` OK
- Últimos runs GitHub Actions:
  - `Backup Critical Data` success, `2026-06-24T19:20:13Z`
  - `Sync World Cup Data` failure, `2026-06-24T18:26:38Z`
  - `Sync World Cup Data` success, `2026-06-24T16:07:03Z`

Current Supabase read-only snapshot:

- `profiles`: 8
- `teams`: 48
- `matches`: 104
- `group_predictions`: 384
- `knockout_predictions`: 0
- `points`: 384
- `sync_runs`: 118

Latest `sync_runs`:

- `2026-06-24T18:27:05.485Z` → `FAILED` / `footballdata`
- `2026-06-24T16:07:30.952Z` → `SUCCESS` / `footballdata`
- `2026-06-24T13:10:41.241Z` → `SUCCESS` / `footballdata`

## 3. Data integrity and predictions

Current production still reflects pre-knockout-v1 operational state:

- `knockout_predictions = 0`
- `game_locks` todavía no muestra `KNOCKOUT_STAGE_ONE` ni `KNOCKOUT_STAGE_TWO`
- siguen existiendo locks legacy por ronda y `CHAMPION`

Implication:

- hasta desplegar y migrar, la nueva UX de ventanas knockout y su scoring no estarán activos en producción.

## 4. Scoring and ranking

Local code review result:

- scoring knockout es idempotente;
- bonus de campeón deriva de la final;
- partidos `FINISHED` sin `winner_side` no puntúan todavía;
- ranking y breakdown aceptan la nueva escala de puntos.

Verification:

- `tests/scoring.service.test.ts`
- `tests/ranking.service.test.ts`
- `tests/knockout-window.service.test.ts`

## 5. Sync/providers/cron

### Finding AUD-2026-06-24-01

- Priority: `P1`
- Effort: `S`
- Status: **fixed in local tree, pending deploy**

Evidence:

- GitHub Actions run `28120561536`
- Failing line summary: `Could not upsert matches: new row for relation "matches" violates check constraint "matches_status_scores_check"`

Root-cause assessment:

- The provider path can transiently surface a match state that is inconsistent with the database constraint on `status` vs `home_score/away_score`.
- Even if rare, the old behavior was to abort the entire scheduled sync.

Local fix:

- `lib/services/sync.service.ts`
- Added `coerceMatchPayloadForStorage(...)` before `matches` upsert.
- Scheduled/postponed/cancelled rows now forcibly clear scores/winner.
- Live/finished rows with incomplete scores are downgraded to safe scheduled storage until the provider becomes consistent.

Verification:

- `tests/sync.service.test.ts`
- full `pnpm test`, `pnpm lint`, `pnpm build`

## 6. Auth/RLS/security

No new auth or RLS regressions found in this review.

Observed:

- Protected layout continues to gate authenticated routes.
- Service-role usage stays server-only.
- Audit was read-only against Supabase; no production mutation performed.

## 7. Frontend/UX/mobile

Knockout UX delivered locally:

- full bracket visible;
- active subwindow editable;
- future subwindow clearly blocked;
- floating bubble in protected layout during the last 24h before each lock;
- dashboard/predictions copy aligned with the two-window model.

No blocking frontend issue found in local verification.

## 8. Tests/build/deploy

Local verification:

- `pnpm test` → pass
- `pnpm lint` → pass
- `pnpm build` → pass

### Finding AUD-2026-06-24-02

- Priority: `P2`
- Effort: `S`
- Status: open

Evidence:

- `next build` warning:
  - `The "middleware" file convention is deprecated. Please use "proxy" instead.`
- current file: `middleware.ts`

Assessment:

- This is **not** a runtime failure.
- Next.js 16 still accepts `middleware.ts`.
- It is a forward-compatibility warning: future Next versions will expect the new `proxy` convention.

Recommendation:

- rename `middleware.ts` to the newer `proxy` convention in a separate small maintenance change;
- do not block the knockout release on this warning.

## 9. Backups and incident readiness

Good:

- backup workflow is active and latest observed run succeeded;
- sync workflow uploads a critical-data artifact before mutating data.

Operational note:

- the failed sync run on `2026-06-24` still produced a backup artifact before aborting.

## 10. Prioritized action table

| ID | Priority | Effort | Action |
|---|---|---:|---|
| AUD-2026-06-24-01 | P1 | S | Deploy this commit so the sync hardening reaches production and re-check the next scheduled sync run. |
| AUD-2026-06-24-03 | P1 | M | Apply `supabase/migrations/007_knockout_windows_and_slots.sql` in production so knockout window locks and slot-based predictions are actually enabled. |
| AUD-2026-06-24-02 | P2 | S | Rename `middleware.ts` to the new `proxy` convention in a maintenance pass. |
