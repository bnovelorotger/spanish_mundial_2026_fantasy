# Project Wrap-Up 2026

Final operational close-out for `app_mundial` after the World Cup 2026 tournament.

## Final Snapshot

- Close-out date: 2026-07-31
- Production app: `https://app-mundial-sage.vercel.app`
- Data provider used for final sync: `footballdata`
- Final local backup: `backups/critical-data-backup-2026-07-31T16-39-14-978Z`
- Latest sync status: `SUCCESS`
- Latest sync started at: `2026-07-31T16:39:24.011Z`
- Latest sync finished at: `2026-07-31T16:39:27.046Z`

## Final Data Counts

| Table | Rows |
| --- | ---: |
| profiles | 9 |
| teams | 48 |
| group_predictions | 384 |
| knockout_predictions | 209 |
| champion_predictions | 2 |
| points | 599 |
| group_standings | 48 |
| sync_runs | 349 |
| game_locks | 9 |

## Final Ranking

| Position | Player | Total | Groups | Knockout | Champion |
| ---: | --- | ---: | ---: | ---: | ---: |
| 1 | Pablín Yamal | 255 | 61 | 169 | 25 |
| 2 | Berni | 248 | 83 | 140 | 25 |
| 3 | Petiit | 245 | 70 | 150 | 25 |
| 4 | Patri | 232 | 63 | 144 | 25 |
| 5 | martimessi2022 | 222 | 78 | 144 | 0 |
| 6 | Andrukillo | 198 | 61 | 112 | 25 |
| 7 | Gasti Jump | 176 | 75 | 101 | 0 |
| 8 | Maytte | 48 | 48 | 0 | 0 |
| 9 | Codex Audit 1782938014039 | 0 | 0 | 0 | 0 |

## Workflow State

The GitHub Actions workflows are intentionally left as manual-only:

- `backup-critical-data.yml`: manual backups remain available, hourly schedule disabled.
- `sync-worldcup.yml`: manual sync remains available, scheduled provider writes disabled.
- `deploy-vercel-production.yml`: manual deploy remains available, push-to-production disabled.

This keeps the project recoverable without allowing automated post-tournament changes to Supabase or Vercel.

## Platform Close-Out Checklist

### GitHub

- Keep the repository private.
- Keep the final wrap-up commit and final backup artifact.
- Optionally create a release/tag named `world-cup-2026-final`.
- Do not delete secrets until the final backup artifact has been downloaded and stored outside GitHub.
- If the app will not be reopened, disable Actions entirely in repository settings after downloading the final artifact.

### Supabase

- Download/export the final backup before deleting or pausing the project.
- Keep `profiles`, predictions, points, standings, matches, and sync runs as the source of truth for audit.
- Optional cleanup: remove the residual audit profile `codex_audit_178293801403` if the league owner confirms it should not appear in final historical ranking.
- If shutting down the Supabase project, rotate/revoke service role and provider keys first.

### Vercel

- Keep the production deployment online if players still need to view the final ranking.
- If shutting the app down, replace it with a static final-results page before deleting the project.
- Remove or rotate environment variables only after no further deploy/sync/backup is needed.

## Known Close-Out Notes

- The final sync completed successfully, but logged one non-fatal knockout canonical prediction collision. The sync still recalculated points and persisted `SUCCESS`.
- `Maytte` remains marked by historical baseline/recovery behavior and has no knockout/champion points.
- The residual `codex_audit_178293801403` profile has zero points and should be reviewed before publishing a public final leaderboard.

## Reopen Procedure

If the app needs post-event repairs:

1. Run `Backup Critical Data` manually.
2. Apply the data repair or code change.
3. Run `Sync World Cup Data` manually only if provider data must be refreshed.
4. Run `Deploy Vercel Production` manually if the frontend needs to change.
5. Record the operation in this document or a follow-up incident note.
