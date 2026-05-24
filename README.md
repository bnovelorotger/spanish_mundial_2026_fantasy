# World Cup 2026 Pick'em

Mobile-first private tournament app for World Cup 2026 predictions. Players
sign in with Supabase Auth, save group and knockout picks, follow the match
calendar, and compete on a live ranking board with idempotent scoring.

## MVP status

The MVP is implemented through Phase 10 of
[docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md):

- App Router shell, auth, protected routes, dashboard, calendar, predictions,
  ranking, sync route, and provider chain are in place.
- Supabase schema, RLS, seeds, scoring, and ranking services are implemented.
- ApiFootball and static providers remain safe skeletons by design until the
  later provider phase.

## Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS v4
- shadcn/ui primitives with custom brand styling
- Supabase Auth, PostgreSQL, and RLS
- Vitest
- GitHub Actions
- Vercel

## Product docs

Project documentation lives in [docs/](docs/). The key sources are:

1. [PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md)
2. [TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md)
3. [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)
4. [SCORING_RULES.md](docs/SCORING_RULES.md)
5. [BRANDBOOK.md](docs/BRANDBOOK.md)
6. [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
7. [ACCEPTANCE_CRITERIA.md](docs/ACCEPTANCE_CRITERIA.md)
8. [CODEX_RULES.md](docs/CODEX_RULES.md)
9. [CODEX_PROMPTS.md](docs/CODEX_PROMPTS.md)

## Local setup

Requirements:

- Node.js 20+
- `pnpm`
- Supabase CLI
- Docker Desktop if you want local Supabase containers

Install and start the app:

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

The app runs at `http://localhost:3000`.

## Environment variables

Copy [.env.example](.env.example) to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CRON_SECRET`
- `WORLD_CUP_API_PROVIDER`
- `WORLD_CUP_API_KEY`
- `NEXT_PUBLIC_APP_URL`
- `APP_URL`

Rules:

- `NEXT_PUBLIC_*` values are browser-safe.
- `SUPABASE_SERVICE_ROLE_KEY` is server-only.
- `.env.local` is git-ignored and must never be committed.

## Supabase setup

Initialize the project with either a local stack or a linked remote project.

Local Supabase flow:

```bash
npx supabase start
npx supabase db reset
```

Linked remote flow:

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npx supabase db push --linked --include-all
```

Schema and seeds live in:

- [supabase/migrations/001_initial_schema.sql](supabase/migrations/001_initial_schema.sql)
- [supabase/migrations/002_rls.sql](supabase/migrations/002_rls.sql)
- [supabase/seed/seed_teams.sql](supabase/seed/seed_teams.sql)
- [supabase/seed/seed_matches_mock.sql](supabase/seed/seed_matches_mock.sql)

## Migrations

Apply the current schema:

```bash
npx supabase db push --linked --include-all
```

Validate local SQL against a running local stack:

```bash
npx supabase db reset
```

## Seed data

The repeatable seed source is configured in
[supabase/config.toml](supabase/config.toml). A local reset loads:

- teams for groups A-L, including TBD support
- mock matches for calendar and bracket development
- sample group standings for scoring tests

Recommended seed command:

```bash
npx supabase db reset
```

Current note:

- `pnpm seed` is still a placeholder script and does not replace the Supabase
  CLI seed flow.

## Development commands

```bash
pnpm dev
pnpm lint
pnpm test
pnpm build
pnpm sync
pnpm recalculate-points
```

What they do:

- `pnpm dev`: start the Next.js app
- `pnpm lint`: run ESLint
- `pnpm test`: run Vitest
- `pnpm build`: production build check
- `pnpm sync`: run the provider chain and upsert World Cup data
- `pnpm recalculate-points`: rebuild deterministic points rows

## Auth and protected routes

- Email/password auth is implemented with `@supabase/ssr`.
- Protected pages live under `app/(protected)`.
- `middleware.ts` redirects unauthenticated users to `/login`.
- Profiles are created server-side on first login if missing.
- `SUPABASE_SERVICE_ROLE_KEY` is only used by server-only admin code and
  scripts.

## Sync and provider switching

Provider interface:

- `ApiFootballProvider`
- `StaticWorldCupProvider`
- `MockWorldCupProvider`

Current MVP default:

```bash
WORLD_CUP_API_PROVIDER=mock
```

Behavior:

- `mock` works end-to-end and is the safe default.
- `static` is a safe skeleton.
- `apifootball` is a safe skeleton for the later real-provider phase.

The sync endpoint is:

- `POST /api/sync`

It requires:

- `Authorization: Bearer <CRON_SECRET>`

## GitHub Actions

Workflow:

- [.github/workflows/sync-worldcup.yml](.github/workflows/sync-worldcup.yml)

It supports:

- manual `workflow_dispatch`
- scheduled execution every 6 hours

Required GitHub secrets:

- `APP_URL`
- `CRON_SECRET`

## Vercel deploy

1. Import the repo into Vercel.
2. Add every required env var from `.env.example`.
3. Set `APP_URL` and `NEXT_PUBLIC_APP_URL` to the deployed URL.
4. Ensure the linked Supabase project has the latest migrations.
5. Trigger a deploy and verify login, protected routes, predictions, ranking,
   and `/api/sync`.

## Repository layout

```text
app/
components/
lib/
scripts/
supabase/
tests/
.github/workflows/
docs/
```

Key runtime areas:

- `app/(auth)`: login flow
- `app/(protected)`: dashboard, calendar, predictions, ranking, profile
- `app/api/sync`: protected sync endpoint
- `lib/services`: auth/profile, matches, predictions, bracket, scoring,
  ranking, sync
- `lib/supabase`: browser, server, admin clients
- `lib/providers`: mock/static/api-football provider chain

## Security notes

- No client code imports the admin Supabase client.
- Secrets are expected only in `.env.local`, Vercel env vars, and GitHub
  secrets.
- Match and points writes are blocked from clients by RLS.
- Sync is protected by `CRON_SECRET`.

## Roadmap

See [docs/ROADMAP.md](docs/ROADMAP.md) for post-MVP work, especially:

- real external provider implementation
- richer sync observability
- knockout propagation and champion predictions
- league creation and invites
- push notifications and reminder loops
