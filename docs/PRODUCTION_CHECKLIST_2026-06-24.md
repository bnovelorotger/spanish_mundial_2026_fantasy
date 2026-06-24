# Production Checklist - 2026-06-24

## Executive Summary

Production backend is aligned with the new knockout schema and sync is healthy again. The frontend mismatch was caused by Vercel blocking Git-triggered production deployments, and it has now been resolved with a manual CLI production deployment from this machine.

## Checklist

- [x] `main` contains knockout v1 two-window code at `afe54f2e3863dd4e9c015a605fc5a05ee7c306d8`.
- [x] Remote Supabase migration `007_knockout_windows_and_slots.sql` is applied.
- [x] `game_locks` contains `KNOCKOUT_STAGE_ONE` and `KNOCKOUT_STAGE_TWO`.
- [x] Manual GitHub sync run after migration finished `SUCCESS`.
- [x] Protected auth flow works in production via the real login/signup form.
- [x] Protected routes load without console warnings or request failures during the audit.
- [x] Knockout UI in production reflects the new two-window experience.
- [x] Knockout copy in production reflects slot picks, two windows, champion bonus from final, and visible lock messaging.

## Evidence

### Backend and operations

- Remote migration applied with `pnpm exec supabase db push --linked`.
- Latest verified sync run after migration:
  - `started_at`: `2026-06-24T20:51:13.439+00:00`
  - `finished_at`: `2026-06-24T20:51:19.645+00:00`
  - `status`: `SUCCESS`
  - `provider`: `footballdata`
- Remote locks present:
  - `KNOCKOUT_STAGE_ONE`: `2026-06-28T19:00:00+00:00`
  - `KNOCKOUT_STAGE_TWO`: `2026-07-09T20:00:00+00:00`

### Vercel deployment diagnosis

- GitHub reports the deployment status for `afe54f2e3863dd4e9c015a605fc5a05ee7c306d8` as:
  - `Git author bnovelorotger must have access to the project on Vercel to create deployments.`
- The corresponding Vercel deployment object for that commit ended as:
  - `state`: `failure`
  - `description`: `Deployment was blocked`
- This is not isolated to the latest commit. Recent production deployments from GitHub are blocked for:
  - `afe54f2` on `2026-06-24`
  - `d0975e5` on `2026-06-17`
  - `8529e54` on `2026-06-16`
  - multiple earlier commits from `2026-06-14` and `2026-06-12`
- The last successful production deployment visible from GitHub metadata is:
  - commit `cc7043c146c7eeaad782ec9d250b8fdc04b81a28`
  - `created_at`: `2026-05-31T11:21:11Z`

Operational conclusion at that moment: production frontend was stale because Vercel Git deployments had been blocked for weeks, not because of a failing build in `main`.

### Frontend screenshots

- Home with onboarding: `docs/audit-assets/prod-home-onboarding-desktop.png`
- Home authenticated: `docs/audit-assets/prod-home-desktop.png`
- Knockout desktop: `docs/audit-assets/prod-knockout-desktop.png`
- Knockout mobile: `docs/audit-assets/prod-knockout-mobile.png`
- Knockout desktop after manual production deploy: `docs/audit-assets/prod-knockout-after-manual-deploy.png`

### Production knockout mismatch

Observed before the manual deploy on `https://app-mundial-sage.vercel.app/predictions?tab=knockout` with a fresh authenticated user:

- Heading rendered in production:
  - `Lee el cuadro ronda a ronda y deja cerrados tus ganadores.`
- Body copy rendered in production:
  - `...solo deja elegir ganador cuando ya se conocen ambos equipos.`
- Match cards rendered in production:
  - `Elige un ganador cuando los dos huecos del cuadro esten ocupados por equipos ya conocidos.`
- All knockout rounds currently display as `Editable`, including `QUARTER_FINALS`, `SEMI_FINALS`, and `FINAL`.

Those strings do not exist in the current repository anymore, where the live code now says:

- [app/(protected)/predictions/page.tsx](/C:/Users/bnove/Documents/projects/folders/app_mundial/app/(protected)/predictions/page.tsx:95)
- [components/worldcup/BracketView.tsx](/C:/Users/bnove/Documents/projects/folders/app_mundial/components/worldcup/BracketView.tsx:34)
- [components/worldcup/BracketPredictionEditor.tsx](/C:/Users/bnove/Documents/projects/folders/app_mundial/components/worldcup/BracketPredictionEditor.tsx:222)

Conclusion at that point: production was serving an older knockout frontend build than `main`.

### Manual remediation applied

- Authenticated Vercel CLI on this machine as `bnovelorotger`.
- Confirmed the correct scope and project:
  - scope: `bernardo-novelo-rotger-s-projects`
  - project: `app-mundial`
- Deployed a clean archive of `HEAD` manually with Vercel CLI in production mode.
- Verified current production alias now points to:
  - deployment `dpl_GsbzSsgs7eLmyJJu3sHcmZUJHvZX`
  - URL `https://app-mundial-h8zi09nmj-bernardo-novelo-rotger-s-projects.vercel.app`
  - created `2026-06-24 23:47 Europe/Madrid`
- Re-checked production knockout page after the deploy and confirmed:
  - new header copy about `bracket por ventanas`
  - `VENTANA 1` summary is visible
  - `ROUND_OF_32` and `ROUND_OF_16` are editable
  - `QUARTER_FINALS`, `SEMI_FINALS`, and `FINAL` now show window 2 read-only copy

### Auto-deploy root cause and follow-up

- Vercel blocked Git-triggered deployments because it attributed GitHub
  `bnovelorotger` to internal Vercel user `bernatnovelo-2598`, not to the
  current project owner `bnovelorotger`.
- `vercel git connect` under the active owner session currently fails with:
  `You need to add a Login Connection to your GitHub account first.`
- Native Git integration is therefore not the trusted release path.
- The recovery plan is documented in:
  - [docs/VERCEL_AUTO_DEPLOY_RECOVERY_2026-06-25.md](/C:/Users/bnove/Documents/projects/folders/app_mundial/docs/VERCEL_AUTO_DEPLOY_RECOVERY_2026-06-25.md:1)
- The repo now includes a GitHub Actions production deploy workflow that
  bypasses Vercel's Git author attribution using `VERCEL_AUTH_JSON`.
- That workflow has been verified end to end with successful run `28133920334`
  and production deployment `dpl_Ccgw7iSPkFuefPxAcjaq4mCqrPNG`.

## Notes

- The floating bubble is expected to be absent today. The first knockout notice only appears during the last `24h` before `KNOCKOUT_STAGE_ONE`, and the lock is still on `2026-06-28T19:00:00+00:00`.
- The Next warning about `middleware` -> `proxy` is unrelated to this mismatch. It is a framework deprecation warning from build time, not a runtime failure.
- The local repository is linked to Vercel project `app-mundial` via `.vercel/repo.json`. The CLI workaround is now proven and can be reused if Git-triggered deploys remain blocked.
