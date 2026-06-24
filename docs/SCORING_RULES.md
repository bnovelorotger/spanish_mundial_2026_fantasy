# Scoring Rules

## Group stage

For each team prediction:

- **+3 points** if exact group position is correct.
- **+1 point** if the team finishes in top 2 but predicted position is different.
- **+2 points** if the team is predicted 3rd and qualifies as best third.

Rules:

- Do not duplicate points.
- Score group predictions against the current standings, not only final tables.
- Points can move during the group stage as football-data updates live standings.
- Do not score incomplete groups: a group needs 4 standings rows before it is eligible.
- Do not score unplayed groups: at least one team in the group must have `played > 0`.
- Use `group_standings` as source of truth.
- Save one points row per scored prediction.
- Prediction provenance does not exclude rows from scoring in v1; it is copied
  into points metadata for auditability.
- `BEST_THIRD` only applies when football-data marks `qualification_status = BEST_THIRD`.

### Scoring examples

| Predicted | Actual | Points | Reason |
|---|---|---|---|
| 1st | 1st | +3 | Exact position |
| 2nd | 2nd | +3 | Exact position |
| 1st | 2nd | +1 | Top 2, wrong position |
| 2nd | 1st | +1 | Top 2, wrong position |
| 3rd | 3rd (BEST_THIRD) | +2 | Best third bonus |
| 3rd | 3rd (qualification pending) | +3 | Exact position |
| 3rd | 3rd (ELIMINATED) | +3 | Exact position |
| 4th | 4th | +3 | Exact position |
| 1st | 3rd | 0 | Wrong |
| 3rd | 1st | 0 | Wrong |

## Knockout rounds

Knockout predictions work in two fixed editing windows:

- Window 1: `ROUND_OF_32` and `ROUND_OF_16`, locked at the first `ROUND_OF_32` kickoff.
- Window 2: `QUARTER_FINALS`, `SEMI_FINALS`, and `FINAL`, locked at the first `QUARTER_FINALS` kickoff.
- A floating in-app notice appears across protected screens from `24h` before each active window closes until the lock time.
- Users pick the **slot that advances** (`HOME` or `AWAY`) for each bracket match.
- The champion bonus is inferred from the selected winner of the final. There is no separate champion form in this version.

### Knockout scoring

| Round | Points |
|---|---|
| Round of 32 | +4 |
| Round of 16 | +6 |
| Quarter-finals | +8 |
| Semi-finals | +15 |
| Final | +25 |
| Champion bonus | +25 extra from the final pick |

Rules:

- Score knockout predictions only when the match is `FINISHED` and the provider has resolved `winner_side`.
- Do not infer a winner from tied `home_score` / `away_score`; wait for provider winner metadata.
- Save one deterministic `KNOCKOUT_WINNER` row per predicted knockout match, including misses with `0` points.
- Save one deterministic `CHAMPION` row for the final prediction, derived from the same chosen side.
- Running recalculation twice must produce the same rows and totals.

## Ranking

Ranking order:

1. Total points descending.
2. Knockout points descending.
3. Older profile `created_at` first.

## Idempotency rules

- The points table uses a unique constraint on `(user_id, source_type, source_id)`.
- `source_id` for group predictions must be deterministic: `group_{letter}_team_{team_id}`.
- `source_id` for knockout predictions must be deterministic: `knockout_match_{match_id}`.
- `source_id` for the champion bonus must be deterministic: `champion_final_{match_id}`.
- Recalculation must delete stale points and insert fresh ones, or use upserts.
- Running recalculation twice must produce the same result.
