# app_mundial Vercel State

## Stable Production Domain

- `https://app-mundial-sage.vercel.app`

## Vercel Project Identity

- team slug: `bernardo-novelo-rotger-s-projects`
- team id: `team_3hftKjZTgVfaA6TXJy3r7LFv`
- project name: `app-mundial`
- project id: `prj_jvMR2q3AvPrYBmICYM1YW2H99dCF`

## Verified Release Path

Primary release path:

- GitHub Actions workflow: `Deploy Vercel Production`
- workflow file: `.github/workflows/deploy-vercel-production.yml`

Required repository secrets for this path:

- `VERCEL_AUTH_JSON`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `WORLD_CUP_API_KEY`
- `CRON_SECRET`

## Verified Successful Workflow Runs

- `28133920334` - first full successful GitHub Actions production deploy
- `28134035193` - second successful verification run after documentation update

## Verified Deployments

- manual CLI recovery deploy:
  - deployment id: `dpl_GsbzSsgs7eLmyJJu3sHcmZUJHvZX`
  - url: `https://app-mundial-h8zi09nmj-bernardo-novelo-rotger-s-projects.vercel.app`
- latest verified GitHub Actions deploy:
  - deployment id: `dpl_B9EDuENYxaiz7RBD8dJRiQi2usy2`
  - url: `https://app-mundial-2dfmvwhzl-bernardo-novelo-rotger-s-projects.vercel.app`

## Known Blocked Native Git Signature

When Vercel native Git deploys fail, the project has already shown this exact
pattern:

- `source = git`
- `readyState = BLOCKED`
- `readyStateReason = The Deployment was blocked because the commit author does not have contributing access to the project on Vercel.`
- `seatBlock.blockCode = TEAM_ACCESS_REQUIRED`
- `attribution.gitUser.login = bnovelorotger`
- `attribution.vercelUser.username = bernatnovelo-2598`

Interpretation:

- GitHub commit attribution is resolving to a stale or different internal
  Vercel account
- this is not a repo author typo; the git author in the repo matched the real
  GitHub account during the incident

## Current Native Git State

At the end of the verified recovery:

- native Vercel Git is not the trusted release path
- the durable production path is GitHub Actions
- reconnecting native Git is optional cleanup, not required for operations

## Useful Commands

Inspect stable production:

```powershell
npx -y vercel inspect https://app-mundial-sage.vercel.app --scope bernardo-novelo-rotger-s-projects
```

List recent deploy workflow runs:

```powershell
gh run list --workflow "Deploy Vercel Production" --limit 5
```

Watch a workflow run:

```powershell
gh run watch <run-id> --exit-status
```

Inspect blocked deployment details:

```powershell
$auth = Get-Content C:\Users\bnove\AppData\Roaming\xdg.data\com.vercel.cli\auth.json | ConvertFrom-Json
$headers = @{ Authorization = "Bearer $($auth.token)" }
Invoke-RestMethod -Headers $headers -Uri "https://api.vercel.com/v13/deployments/<deployment-id>?teamId=team_3hftKjZTgVfaA6TXJy3r7LFv" -Method Get | ConvertTo-Json -Depth 10
```

## Important Notes

- `vercel pull` in CI succeeded with `VERCEL_AUTH_JSON`, but `vercel build`
  still needed explicit env injection for Supabase and app runtime vars.
- The app already remained operational during the incident because sync had been
  decoupled from `/api/sync` and ran directly in GitHub Actions.
