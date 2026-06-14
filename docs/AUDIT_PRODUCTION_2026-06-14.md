# Production Audit - 2026-06-14

## 0. Executive Summary

Production is back to a consistent operational state after the prediction data incident: sync is succeeding, `group_predictions` has 384 rows, and scoring recalculates 160 eligible group-position point rows. The main remaining risk is not app availability, but data provenance: several repaired predictions are placeholders or inferred/manual reconstructions, so league fairness depends on user review.

Top risks:

- **P0-001**: no automated backup/export of `group_predictions`; Supabase Free has no PITR.
- **P1-002**: partial group predictions are still hidden by a UI fallback if corruption ever returns.
- **P1-003**: users with no real predictions can receive points if filled with a baseline, although unplayed groups no longer score.

## 1. Current Production Health

Evidence from Supabase on 2026-06-14:

- `profiles`: 8
- `teams`: 48
- `matches`: 104
- `group_standings`: 48
- `group_predictions`: 384
- `points`: 160
- `knockout_predictions`: 0
- `champion_predictions`: 0

Latest successful sync:

- provider: `footballdata`
- status: `SUCCESS`
- matches synced: 104
- standings synced: 48
- recalculation: `rows_scored=160`
- awarded total: `144`

Latest successful production endpoint check:

- endpoint: `POST https://app-mundial-sage.vercel.app/api/sync`
- result: `200`
- provider: `footballdata`
- `group_predictions` before/after: `384 -> 384`
- `points` before/after: `160 -> 160`

## 2. Data Integrity And Predictions

### P0-001 - No production prediction backup

- **Priority**: P0
- **Effort**: M
- **Evidence**: no `pg_dump`, artifact upload, or backup job in `.github/workflows/sync-worldcup.yml`; Supabase Free plan has no backups/PITR.
- **Impact**: if predictions are deleted again, there is no authoritative rollback point.
- **Recommendation**: add a scheduled export of `profiles`, `teams`, `group_predictions`, `knockout_predictions`, `champion_predictions`, and `points` to a private storage target or GitHub Actions artifact with retention. Run it before every sync or at least hourly during active tournament windows.

### P1-002 - Partial group predictions are visually masked

- **Priority**: P1
- **Effort**: S
- **Evidence**: `lib/services/predictions.service.ts` falls back to default team order unless `orderedFromSaved.length === 4`.
- **Impact**: if a future incident leaves 1-3 rows for a group, the UI can show an apparently complete default order, hiding the partial saved state.
- **Recommendation**: merge saved rows with missing teams instead of replacing the whole group with default order. Mark incomplete groups as needing review.

### P1-003 - Placeholder predictions can distort ranking

- **Priority**: P1
- **Effort**: M
- **Evidence**: manual repair filled `FALTA` slots to make 384 rows; Maytte had no original rows but a deterministic baseline still scores in groups that have started.
- **Impact**: players who did not submit picks can receive points from placeholders.
- **Recommendation**: add `is_reconstructed`, `reconstruction_source`, or a separate `prediction_repair_audit` table. Exclude unconfirmed baseline rows from scoring until confirmed, or score them with an explicit league decision.

### P1-004 - Group prediction FK cascade remains structurally risky

- **Priority**: P1
- **Effort**: M
- **Evidence**: `supabase/migrations/001_initial_schema.sql` uses `group_predictions_team_group_fkey` with `on update cascade on delete cascade`.
- **Impact**: application guards now block known dangerous sync paths, but the database still allows cascades if a privileged path updates `(team_id, group_letter)`.
- **Recommendation**: add a migration to change destructive cascades to restrictive behavior for predictions, or add immutable team-group semantics after tournament start.

## 3. Scoring And Ranking

### P1-005 - Reconstructed rows are indistinguishable in scoring

- **Priority**: P1
- **Effort**: M
- **Evidence**: `points` is derived from all `group_predictions`; there is no source/provenance column on predictions.
- **Impact**: manual placeholders and real user-submitted picks are scored identically.
- **Recommendation**: add provenance metadata before applying further manual recoveries.

### P1-016 - Unplayed group standings previously inflated ranking

- **Priority**: P1
- **Effort**: Done for current path
- **Evidence**: fixed in `b43d1d2`; `lib/services/scoring.service.ts` now requires a complete group and at least one `played > 0` standing row before scoring.
- **Status**: mitigated in production.
- **Recommendation**: keep the regression test in `tests/scoring.service.test.ts` and do not relax the eligibility guard.

### P2-006 - Live scoring behavior is correct but needs league copy

- **Priority**: P2
- **Effort**: S
- **Evidence**: `docs/SCORING_RULES.md` and ranking UI support live scoring.
- **Impact**: users may perceive points moving as a bug.
- **Recommendation**: keep the live badge and add short copy in ranking/profile explaining that points change while standings are live.

## 4. Sync, Providers, And Cron

### P0-007 - Sync previously mutated prediction-critical team groups

- **Priority**: P0
- **Effort**: Done for current path
- **Evidence**: fixed in `aaf29f6` and `36e3e15`; current sync preserves predicted teams and blocks provider regrouping for teams with saved group predictions.
- **Status**: mitigated in production.
- **Recommendation**: keep regression tests in `tests/sync.service.test.ts` and do not remove the guard.

### P1-008 - Sync endpoint recalculates twice

- **Priority**: P1
- **Effort**: S
- **Evidence**: `app/api/sync/route.ts` calls `syncWorldCupData()` and then calls `recalculateAllPoints()` again.
- **Impact**: extra DB writes and harder interpretation of sync summaries.
- **Recommendation**: return the `syncWorldCupData()` recalculation summary instead of recalculating again unless an explicit `forceRecalculate` mode is needed.

### P1-009 - Failed syncs are logged but not alerted beyond Actions email

- **Priority**: P1
- **Effort**: M
- **Evidence**: `sync_runs` captures failures; GitHub Actions fails on non-2xx.
- **Impact**: production can be stale until someone notices email.
- **Recommendation**: add a visible admin/status page or webhook notification for failed sync runs.

## 5. Auth, RLS, And Security

### P1-010 - Manual production repairs rely on service role scripts

- **Priority**: P1
- **Effort**: M
- **Evidence**: incident repairs used local Node scripts with `SUPABASE_SERVICE_ROLE_KEY`.
- **Impact**: necessary for emergency work, but high blast radius.
- **Recommendation**: create reviewed, parameterized admin scripts for prediction repair and export; never ad-hoc rewrite destructive operations.

### P2-011 - Storage bucket setup is documented but operator-dependent

- **Priority**: P2
- **Effort**: S
- **Evidence**: avatar storage migration documents policies, but public bucket creation remains a dashboard/operator action.
- **Recommendation**: add an operational checklist to README/deploy docs.

## 6. Frontend, UX, And Mobile

### P1-012 - Repaired/unconfirmed predictions are not surfaced in UI

- **Priority**: P1
- **Effort**: M
- **Evidence**: prediction view models expose saved/locked/completed, but not provenance.
- **Impact**: users cannot see which predictions were restored, inferred, or still need confirmation.
- **Recommendation**: after adding provenance metadata, show a small "pendiente de confirmar" badge per reconstructed group.

### P2-013 - Locked group stage can still show editable mental model

- **Priority**: P2
- **Effort**: S
- **Evidence**: automatic lock resolves correctly from `lock_at`, but `game_locks.locked` remains `false`.
- **Impact**: DB inspection is confusing; UI is likely correct via `resolvePhaseLock`.
- **Recommendation**: optionally persist `locked=true` after lock time or improve admin copy to explain automatic locks.

## 7. Tests, Build, And Deployment

Current verification:

- `pnpm lint`: pass
- `pnpm test`: pass, 23 files, 114 tests
- `pnpm build`: pass

### P1-014 - No test for partial prediction display

- **Priority**: P1
- **Effort**: S
- **Evidence**: tests cover prediction validation but not UI/service behavior for partial saved rows.
- **Recommendation**: add a `predictions.service.test.ts` case proving partial rows are shown/flagged rather than hidden.

### P1-015 - No automated DB backup test/runbook

- **Priority**: P1
- **Effort**: M
- **Evidence**: new skill documents the workflow, but no script exists yet.
- **Recommendation**: implement a `scripts/export-critical-data.ts` and schedule it.

## 8. Backups And Incident Readiness

New repo-scoped skills created:

- `prediction-recovery-operator`
- `sync-incident-responder`
- `production-audit-runbook`

These codify the incident workflows and should be invoked for future production data changes.

## 9. Prioritized Action Table

| ID | Priority | Effort | Area | Recommendation |
|---|---|---:|---|---|
| P0-001 | P0 | M | Backups | Add automated critical-table exports before/hourly sync. |
| P0-007 | P0 | Done | Sync | Keep prediction-preserving sync guards and tests. |
| P1-002 | P1 | S | Predictions UI | Display partial saved rows instead of default fallback. |
| P1-003 | P1 | M | Fairness | Add prediction provenance and exclude unconfirmed baselines if needed. |
| P1-004 | P1 | M | Schema | Remove/restrict destructive prediction cascades. |
| P1-005 | P1 | M | Scoring | Track reconstructed prediction rows before scoring decisions. |
| P1-008 | P1 | S | Sync | Avoid double recalculation in `/api/sync`. |
| P1-009 | P1 | M | Ops | Add failed-sync alerting/status surface. |
| P1-010 | P1 | M | Ops/Security | Replace ad-hoc service-role repairs with reviewed scripts. |
| P1-012 | P1 | M | UX | Show restored/unconfirmed prediction badges. |
| P1-014 | P1 | S | Tests | Add partial prediction display regression tests. |
| P1-015 | P1 | M | Backups | Implement backup/export script and schedule. |
| P1-016 | P1 | Done | Scoring | Keep unplayed standings excluded from scoring. |
| P2-006 | P2 | S | Copy | Reinforce live-scoring explanation. |
| P2-011 | P2 | S | Deploy | Add avatar storage checklist. |
| P2-013 | P2 | S | Locks | Clarify automatic lock state in DB/admin docs. |
