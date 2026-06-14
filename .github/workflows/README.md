# .github/workflows

GitHub Actions workflows.

Expected files:

- `backup-critical-data.yml` - Scheduled hourly at minute 55 plus
  `workflow_dispatch`. Exports critical Supabase tables and uploads a private
  GitHub artifact with 30-day retention.
- `sync-worldcup.yml` - Scheduled hourly plus `workflow_dispatch`. First
  exports the same critical-data artifact, then calls `POST $APP_URL/api/sync`
  with `Authorization: Bearer ${{ secrets.CRON_SECRET }}`.
- `ci.yml` *(optional)* - Run `pnpm lint`, `pnpm test`, `pnpm build` on PRs.

Required repository secrets or variables:

- `APP_URL` - Public deployment URL, for example
  `https://your-app.vercel.app`.
- `CRON_SECRET` - Same value set in Vercel env vars for `/api/sync`.
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL used by backup scripts.
- `SUPABASE_SERVICE_ROLE_KEY` - Server-only key used by backup scripts.

Rules:

- Never echo secrets in logs.
- The sync workflow must fail before calling `/api/sync` if the pre-sync backup
  cannot be created.
