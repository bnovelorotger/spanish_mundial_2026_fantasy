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
- Use group_standings as source of truth.
- Save one points row per scored prediction.
- BEST_THIRD only applies when football-data marks qualification_status = BEST_THIRD.

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

Not required for MVP 1, but prepare types.

Future scoring:

| Round | Points |
|---|---|
| Round of 32 | +4 |
| Round of 16 | +6 |
| Quarter-finals | +8 |
| Semi-finals | +10 |
| Final | +15 |
| Champion | +25 extra |

## Ranking

Ranking order:

1. Total points descending.
2. Knockout points descending.
3. Older profile created_at first.

## Idempotency rules

- The points table uses a unique constraint on (user_id, source_type, source_id).
- source_id for group predictions should be deterministic: e.g. `group_{letter}_team_{team_id}`.
- Recalculation must delete stale points and insert fresh ones, or use upserts.
- Running recalculation twice must produce the same result.
