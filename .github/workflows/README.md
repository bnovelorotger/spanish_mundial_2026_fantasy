# .github/workflows

GitHub Actions workflows.

Expected files:

- `backup-critical-data.yml` - Scheduled hourly at minute 55 plus
  `workflow_dispatch`. Exports critical Supabase tables and uploads a private
  GitHub artifact with 30-day retention.
- `sync-worldcup.yml` - Scheduled hourly plus `workflow_dispatch`. First
  exports the same critical-data artifact, then runs the sync directly against
  Supabase with `pnpm sync` (the repository's current code). It no longer calls
  the deployed `/api/sync`, so scheduled scoring is decoupled from the Vercel
  deployment.
- `deploy-vercel-production.yml` - Push-to-`main` plus `workflow_dispatch`.
  Builds the repo in GitHub Actions and deploys it to Vercel production using a
  stored Vercel CLI `auth.json`, bypassing Vercel's native Git author
  attribution.
- `ci.yml` *(optional)* - Run `pnpm lint`, `pnpm test`, `pnpm build` on PRs.

Required repository secrets:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (backup + sync).
- `SUPABASE_SERVICE_ROLE_KEY` - Server-only key (backup + sync).
- `WORLD_CUP_API_KEY` - football-data.org API key used by the sync step.
- `VERCEL_AUTH_JSON` - Serialized Vercel CLI `auth.json` for production deploys.

The deployed app still serves data by reading Supabase, so it does not need
these workflows to be healthy to display the latest standings.

Rules:

- Never echo secrets in logs.
- The sync workflow must fail before mutating data if the pre-sync backup
  cannot be created.
- The deploy workflow is the primary production release path while Vercel's
  native Git integration remains blocked by commit attribution.
