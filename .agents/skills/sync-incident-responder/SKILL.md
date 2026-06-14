---
name: sync-incident-responder
description: Use this skill when GitHub Actions sync jobs fail, Vercel deployments are blocked, /api/sync returns errors, provider data corrupts Supabase rows, or production sync needs to be paused, diagnosed, redeployed, or safely re-enabled.
---

# Sync Incident Responder

## Purpose

Handle production sync incidents without worsening database state.

Use this with:

- `provider-sync-guard` for provider and sync architecture.
- `supabase-rls-reviewer` for service role and protected table writes.
- `prediction-recovery-operator` if predictions may have been touched.

## First Response

1. Stop the bleeding before debugging deeply.
2. Pause the GitHub Actions workflow if sync may be destructive.
3. Snapshot affected tables before attempting repair.
4. Confirm which deployment is serving the stable production domain.
5. Confirm the failing run uses the expected commit and env vars.

## Checks

Verify:

- GitHub Actions `CRON_SECRET` exists and matches Vercel.
- GitHub Actions `APP_URL` points to the stable Vercel app URL, without `/api/sync`.
- Vercel production deployment is `Ready` and aliased to the stable domain.
- `/api/sync` returns `401` for missing/wrong secret.
- successful sync writes a `sync_runs` row.
- `sync_runs.summary` includes provider, failures, and recalculation status.
- provider failures do not expose secrets.

## Deployment Workaround

If Vercel Git integration blocks deployment because of commit author:

1. Authenticate locally with Vercel CLI as the project owner.
2. Link the local repo to the Vercel project.
3. Deploy with `vercel deploy --prod --yes`.
4. Inspect the stable domain and confirm the alias moved.
5. Keep GitHub Actions paused until the new deployment is verified.

## Provider Drift Guardrails

Before enabling sync after incidents, check for destructive routes:

- stale team pruning must not delete teams referenced by predictions;
- provider team regrouping must not cascade into `group_predictions`;
- match upserts must preserve `match_number` identity;
- standings recalculation must be idempotent;
- points recalculation must not duplicate rows.

## Required Verification

After a fix:

- run `pnpm lint`;
- run `pnpm test`;
- run `pnpm build`;
- deploy production;
- trigger one manual workflow run;
- verify `sync_runs` success;
- verify prediction counts before and after sync;
- re-enable scheduled workflow only after all checks pass.

## Output

Report:

- workflow state before/after;
- deployment URL and alias;
- commit deployed;
- sync run conclusion;
- latest `sync_runs` status;
- prediction row deltas;
- remaining risks.
