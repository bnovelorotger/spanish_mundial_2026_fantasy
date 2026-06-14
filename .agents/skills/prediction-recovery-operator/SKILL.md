---
name: prediction-recovery-operator
description: Use this skill when repairing, reconstructing, importing, exporting, or auditing user predictions after data loss, partial rows, sync corruption, manual review, or tournament lock incidents in the World Cup Pick'em app.
---

# Prediction Recovery Operator

## Purpose

Recover prediction data safely without inventing user intent or corrupting scoring.

Use this together with:

- `supabase-rls-reviewer` for database writes and service role safety.
- `scoring-engine-validator` before and after recalculating points.
- `provider-sync-guard` when sync or provider drift caused the incident.

## Non-negotiables

- Never write production predictions without a local JSON backup first.
- Never expose Supabase service-role secrets.
- Never trust frontend state as the only source of truth.
- Never silently infer user intent unless the inference is deterministic and documented.
- Always mark manual, inferred, placeholder, or unconfirmed rows in an artifact.
- Always validate 4 unique teams and positions `1..4` per user/group before writing.
- Always run `pnpm recalculate-points` after changing scored predictions.

## Recovery Workflow

1. Pause automated sync if it can race the repair.
2. Export current `profiles`, `teams`, `group_predictions`, `points`, and `sync_runs` to a timestamped local backup.
3. Identify the source artifact:
   - Supabase backup/PITR export.
   - Local incident JSON.
   - Manual Markdown/CSV reviewed by users.
   - Deterministic inference output.
4. Normalize by `username`, `group_letter`, `predicted_position`, and `team_code`.
5. Validate every proposed row:
   - profile exists;
   - team code exists;
   - team belongs to the same group;
   - each group has exactly 4 positions;
   - each group has exactly 4 unique team IDs;
   - no duplicate `(user_id, group_letter, team_id)`;
   - no duplicate `(user_id, group_letter, predicted_position)`.
6. Apply the smallest safe write:
   - one user if one user is being corrected;
   - all group predictions only when restoring a full reviewed set.
7. Run `pnpm recalculate-points`.
8. Verify counts and ranking from Supabase, not from assumptions.
9. Re-enable sync only after verification passes.

## Acceptable Inference

Only infer a missing prediction when all are true:

- exactly one position is missing in a user/group;
- exactly one team from that group's roster is missing;
- no duplicate team code exists in that group;
- no team belongs to another group.

Mark it as `INFERIDO_100` in local artifacts until the user accepts it.

## Placeholder Policy

If a user never made predictions, prefer one of:

- leave the user with no predictions and zero group-stage points;
- create a clearly documented baseline only if the league owner explicitly chooses it.

Baselines must be deterministic and named, for example:

- `team name ascending within each group`;
- `team code ascending within each group`;
- `current UI order at time of repair`.

Do not optimize baselines against standings.

## Required Verification Queries

After repair, verify:

- `group_predictions` row count equals expected participants times `48`.
- every included user has `48` rows.
- every user/group has `4` rows.
- every user/group has unique positions and team IDs.
- all prediction teams belong to the prediction group.
- `points` has one `GROUP_POSITION` row per prediction after recalculation.

## Output

When finishing, report:

- backup path;
- source artifact path;
- rows inserted/updated/deleted;
- auto-filled or inferred rows count;
- recalculation result;
- final row counts;
- current ranking impact;
- remaining manual review items.
