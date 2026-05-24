# World Cup 2026 Pick'em

Mobile-first web app for friends to predict the FIFA World Cup 2026, compete on
a ranking, and track points automatically.

> **Status:** project bootstrap. Phase 1 of [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
> has not been executed yet — Codex picks it up from here.

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (Postgres + Auth + RLS)
- Vitest for unit tests
- GitHub Actions for scheduled sync
- Vercel for deployment

## Repository layout

```
/app                 Next.js App Router pages and API routes
/components
  /layout            App shell, header, bottom nav
  /worldcup          Domain components (matches, predictions, ranking, bracket)
  /ui                shadcn/ui primitives
/lib
  /supabase          Browser, server, and admin Supabase clients
  /services          Business logic (predictions, scoring, ranking, sync, ...)
  /providers         External data providers (mock, static, apifootball)
  /utils             Pure helper functions
  /types             Shared TypeScript types and DTOs
/scripts             Standalone CLI scripts (seed, sync, recalculate-points)
/supabase
  /migrations        Ordered SQL migrations
  /seed              Repeatable seed SQL
/tests               Unit and integration tests (Vitest)
/.github/workflows   GitHub Actions
/docs                Project specification, plan, and Codex prompts
```

Each empty subfolder has a `README.md` describing what files belong there and
in which phase they are created.

## Documentation

All product and engineering decisions live in [docs/](docs/). Read in this
order:

1. [PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) — what we are building and why.
2. [TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md) — stack, folder
   layout, architecture rules.
3. [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) — Supabase tables, RLS,
   constraints, indexes.
4. [SCORING_RULES.md](docs/SCORING_RULES.md) — group, knockout, and ranking
   scoring rules.
5. [BRANDBOOK.md](docs/BRANDBOOK.md) — visual identity, Tailwind tokens,
   components, motion, copy. **Mandatory before any UI work.**
6. [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) — phases 1 → 11.
7. [ACCEPTANCE_CRITERIA.md](docs/ACCEPTANCE_CRITERIA.md) — per-phase
   acceptance checklist.
8. [CODEX_RULES.md](docs/CODEX_RULES.md) — hard rules the code generator must
   follow.
9. [CODEX_PROMPTS.md](docs/CODEX_PROMPTS.md) — copy-paste prompts, one per phase.
10. [SKILLS_USAGE.md](docs/SKILLS_USAGE.md) — how to use the repo-scoped Codex
    skills in [`.agents/skills/`](.agents/skills/).
11. [ROADMAP.md](docs/ROADMAP.md) — timeline and post-MVP plans.

Project-level instructions also live in [AGENTS.md](AGENTS.md), which Codex
loads automatically before any task.

## Working with Codex

The workflow is strict: **one phase at a time**, no skipping.

1. Pick the next pending phase in [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).
2. Copy the matching prompt from [docs/CODEX_PROMPTS.md](docs/CODEX_PROMPTS.md)
   and prepend the relevant skill invocations from
   [docs/SKILLS_USAGE.md](docs/SKILLS_USAGE.md) (always `$project-phase-guardian`
   at minimum).
3. Run `pnpm lint && pnpm test && pnpm build` before accepting the result.
4. Walk through the post-phase checklist in
   [ACCEPTANCE_CRITERIA.md](docs/ACCEPTANCE_CRITERIA.md) before moving on.

## Local setup (after Phase 1 lands)

```bash
pnpm install
cp .env.example .env.local        # then fill in real Supabase + secrets
pnpm dev                          # http://localhost:3000
```

Useful scripts (each becomes available in the phase that introduces it):

```bash
pnpm dev                   # Phase 1
pnpm build                 # Phase 1
pnpm lint                  # Phase 1
pnpm test                  # Phase 1
pnpm seed                  # Phase 2/3 — load seed SQL into Supabase
pnpm sync                  # Phase 8  — run sync locally
pnpm recalculate-points    # Phase 7  — re-run idempotent scoring
```

## Deployment

- **Vercel:** import the repo, set the env vars from `.env.example`, deploy.
- **Sync cron:** see [.github/workflows/README.md](.github/workflows/README.md)
  for the secrets the scheduled action expects.

## Security

- `SUPABASE_SERVICE_ROLE_KEY` is **server only**. Never import
  `/lib/supabase/admin.ts` from a Client Component.
- The sync endpoint is gated by `CRON_SECRET` — see
  [docs/CODEX_RULES.md](docs/CODEX_RULES.md).
- RLS is the second layer of defence; server-side validation is the first.
