# .github/workflows

GitHub Actions workflows.

Expected files:

- `sync-worldcup.yml` — Scheduled (cron every 6h) + `workflow_dispatch`. Calls
  `POST $APP_URL/api/sync` with `Authorization: Bearer ${{ secrets.CRON_SECRET }}`
  (Phase 8).
- `ci.yml` *(optional)* — Run `pnpm lint`, `pnpm test`, `pnpm build` on PRs.

Required repository secrets:

- `APP_URL` — Public deployment URL (e.g. `https://your-app.vercel.app`).
- `CRON_SECRET` — Same value set in Vercel env vars for `/api/sync`.

Rules:

- Never echo secrets in logs.
- The sync workflow must not block on errors longer than a few seconds — the
  endpoint itself does the heavy lifting.
