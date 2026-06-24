---
name: vercel-deploy-recovery-operator
description: Recover, verify, or harden app_mundial production deploys when Vercel Git deployments are blocked, production serves a stale frontend, Vercel/GitHub attribution is broken, or GitHub Actions must become the durable production release path. Use for Vercel CLI deploys, GitHub Actions deploy workflow fixes, deploy secret setup, deployment inspection, and production alias verification.
---

# Vercel Deploy Recovery Operator

Use this skill when production deploys for `app_mundial` are blocked, stale, or
need to be migrated away from Vercel's native Git integration.

Read `references/app-mundial-vercel-state.md` before making changes. It contains
the verified project ids, domain, workflow name, and the exact blocked-deploy
signature already seen in production.

Use this with:

- `sync-incident-responder` when sync safety and deploy health overlap
- `production-audit-runbook` when the user asks for a broader production audit

## Workflow

### 1. Confirm the current production target

Always verify which deployment serves the stable domain before changing
anything.

Check:

- `vercel inspect https://app-mundial-sage.vercel.app --scope bernardo-novelo-rotger-s-projects`
- the latest `Deploy Vercel Production` runs in GitHub Actions
- whether production is already healthy and only the release path is broken

### 2. Identify which deploy path is failing

Classify the incident quickly:

- `source=git` deployments blocked in Vercel: native Git integration issue
- `source=cli` or GitHub Actions deploys failing: workflow or auth issue
- production alias still on an old deployment: stale frontend in production

For native Git failures, inspect both GitHub and Vercel metadata. Capture:

- commit SHA
- blocked deployment id
- `readyStateReason`
- `attribution.gitUser`
- `attribution.vercelUser`

### 3. Use the safe fallback if production is stale

If the app is stale and the user needs production fixed immediately:

1. authenticate Vercel CLI locally
2. deploy a clean archive of `HEAD`
3. verify the alias moved to the new deployment
4. verify the target route in the browser, not just via CLI

Do not deploy a dirty worktree to production when unrelated local files exist.
Prefer exporting a clean archive of `HEAD` into a temp directory and deploying
from there.

### 4. Prefer the GitHub Actions release path for durability

For this project, the durable production release path is GitHub Actions, not
Vercel's native Git integration.

Use the repo workflow:

- `.github/workflows/deploy-vercel-production.yml`

Requirements:

- `VERCEL_AUTH_JSON` repository secret
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` repository secret
- existing runtime secrets already used by the app

The workflow should:

1. prepare a temporary Vercel global config from `VERCEL_AUTH_JSON`
2. `vercel pull --environment=production`
3. build with the required env vars present
4. `vercel deploy --prebuilt --prod`
5. verify the alias assignment in logs

### 5. Treat native Git reconnect as optional cleanup

If Vercel native Git deployments are blocked because commit attribution maps to
the wrong internal Vercel user, do not assume reconnecting Git will be a quick
fix.

If you investigate native Git, verify:

- the current owner Vercel username
- the GitHub login on the blocked deployment
- the Vercel user that the blocked deployment attributes the commit to
- whether `vercel git connect` succeeds under the current owner session

If reconnecting Git is still blocked by missing login connections, stop trying
to make that the primary release path. Keep GitHub Actions as the supported
path and document the root cause.

## Guardrails

- Never expose Vercel secrets, `auth.json`, access tokens, or refresh tokens in
  logs or docs.
- Never assume a successful `vercel pull` means `vercel build` will pass; build
  may still require explicit env injection in CI.
- Always verify the deployed alias on `app-mundial-sage.vercel.app`.
- If you update release automation, run `pnpm lint`, `pnpm test`, and
  `pnpm build` locally first when feasible.
- After any release-path change, watch at least one full `Deploy Vercel
  Production` run to `success`.

## Required Output

Report:

- which deploy path is active now
- latest successful deploy workflow run id
- deployment id and production URL now serving the alias
- secrets/workflows changed
- whether native Vercel Git deploys remain broken or are still intentionally
  bypassed
