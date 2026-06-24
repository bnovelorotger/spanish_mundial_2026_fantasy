# Vercel Auto-Deploy Recovery - 2026-06-25

## Status

Production is healthy, but native Vercel Git deploys are not currently the
reliable release path.

- Production frontend is live on the manual CLI deployment from
  `afe54f2e3863dd4e9c015a605fc5a05ee7c306d8`.
- Scheduled sync and scoring are healthy because GitHub Actions runs `pnpm sync`
  directly against Supabase.
- Native Vercel Git integration is currently disconnected while we switch to a
  GitHub Actions-based production deploy.

## Root Cause

Vercel is attributing the GitHub user `bnovelorotger` to a different internal
Vercel account than the current project owner.

Evidence from blocked Git deployments:

- `readyState = BLOCKED`
- `readyStateReason = The Deployment was blocked because the commit author does not have contributing access to the project on Vercel.`
- `attribution.gitUser.login = bnovelorotger`
- `attribution.vercelUser.username = bernatnovelo-2598`
- `seatBlock.blockCode = TEAM_ACCESS_REQUIRED`

At the same time, the current authenticated owner of the team and project is:

- Vercel username: `bnovelorotger`
- team role: `OWNER`
- team slug: `bernardo-novelo-rotger-s-projects`

So the failure is not caused by a wrong Git author in the repo. It is caused by
Vercel mapping that GitHub identity to a stale or different Vercel account.

## What We Verified

- Commits that deployed successfully in late May and commits blocked in June use
  the same git author: `XaiNiN <bnovelorotger@gmail.com>`.
- Recent `READY` production deployments were manual `cli` or `redeploy`
  operations, not successful native Git deploys.
- `vercel git connect` currently fails under the active owner session with:
  `You need to add a Login Connection to your GitHub account first.`

## Chosen Mitigation

Instead of depending on Vercel's native Git author attribution, production
deploys should run from GitHub Actions:

1. checkout `main`
2. install dependencies
3. `vercel pull --environment=production`
4. `vercel build --prod`
5. `vercel deploy --prebuilt --prod`

This path is implemented in:

- `.github/workflows/deploy-vercel-production.yml`

It uses:

- `VERCEL_ORG_ID = team_3hftKjZTgVfaA6TXJy3r7LFv`
- `VERCEL_PROJECT_ID = prj_jvMR2q3AvPrYBmICYM1YW2H99dCF`

## Implemented Release Path

The repo now ships a production deploy workflow that uses the owner session's
serialized Vercel CLI credentials instead of a classic Vercel token:

- workflow: `.github/workflows/deploy-vercel-production.yml`
- secret: `VERCEL_AUTH_JSON`

Why this works:

- `vercel --global-config <dir>` accepts an `auth.json` file directly
- the stored payload contains both `token` and `refreshToken`
- the CLI can refresh the access token on demand in GitHub Actions

This avoids the limitation that prevented creating a classic token from an
OAuth-authenticated CLI session.

## Verified Result

The GitHub Actions production deploy path is now active and verified.

- repository secret configured: `VERCEL_AUTH_JSON`
- workflow: `Deploy Vercel Production`
- first green verification run: `28133920334`
- verified production deployment:
  - deployment id: `dpl_Ccgw7iSPkFuefPxAcjaq4mCqrPNG`
  - URL: `https://app-mundial-bi7xjmymt-bernardo-novelo-rotger-s-projects.vercel.app`
  - alias: `https://app-mundial-sage.vercel.app`

At this point, production deploys no longer depend on Vercel's broken native
Git author attribution for this project.

## Optional Long-Term Cleanup

If we want to restore native Vercel Git deploys later, the account owner should:

1. open Vercel account settings
2. review `Authentication` / `Login Connections`
3. connect the correct GitHub account to the current Vercel owner account
4. confirm that future blocked deployments no longer attribute GitHub
   `bnovelorotger` to Vercel user `bernatnovelo-2598`
5. reconnect the project Git repository if we decide to return to native Git
   deploys
