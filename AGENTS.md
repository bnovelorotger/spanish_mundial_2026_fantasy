# Project Instructions for Codex

This repository is a mobile-first **World Cup 2026 Pick'em** app.

Before implementing any task, read the relevant docs in [`/docs`](docs/).
At minimum:

- [PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md)
- [TECHNICAL_ARCHITECTURE.md](docs/TECHNICAL_ARCHITECTURE.md)
- [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)
- [SCORING_RULES.md](docs/SCORING_RULES.md)
- [BRANDBOOK.md](docs/BRANDBOOK.md) — mandatory before any UI work.
- [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
- [ACCEPTANCE_CRITERIA.md](docs/ACCEPTANCE_CRITERIA.md)
- [CODEX_RULES.md](docs/CODEX_RULES.md)
- [CODEX_PROMPTS.md](docs/CODEX_PROMPTS.md)
- [SKILLS_USAGE.md](docs/SKILLS_USAGE.md)

## Required behavior

- Follow [`/docs/CODEX_RULES.md`](docs/CODEX_RULES.md).
- Work **phase by phase**. Do not implement future phases early.
- Use App Router only — no Pages Router.
- Use TypeScript strictly. No `any` unless justified.
- Supabase is the only data source for the frontend.
- Never expose secrets.
- Never use `SUPABASE_SERVICE_ROLE_KEY` in client code.
- Run verification before completion when available:
  - `pnpm lint`
  - `pnpm test`
  - `pnpm build`

## Visual identity

The app's visual identity is **Private Tournament Mode**, fully specified in
[`/docs/BRANDBOOK.md`](docs/BRANDBOOK.md). Any UI work must use the brandbook's
Tailwind tokens, typography (Inter + Space Grotesk), components and motion
rules. No betting/casino/corporate-dashboard aesthetics.

## Skills

Use the repo-scoped skills in [`.agents/skills/`](.agents/skills/). Full guide
in [`docs/SKILLS_USAGE.md`](docs/SKILLS_USAGE.md).

For every phase task, always invoke:

```txt
$project-phase-guardian
```

Use additional skills when relevant:

- `$supabase-rls-reviewer` — database / auth / RLS / security.
- `$scoring-engine-validator` — scoring and ranking.
- `$mobile-sports-ui-reviewer` — UI work.
- `$provider-sync-guard` — sync, providers, GitHub Actions.
- `$acceptance-test-writer` — tests for business rules.

## Standard task prompt

```txt
Use $project-phase-guardian.

Continue with Phase [X] only.

Read the relevant docs in /docs before coding.
Do not implement future phases.
Do not add unnecessary dependencies.

At the end run:
- pnpm lint
- pnpm test
- pnpm build

Return: files changed, what was implemented, verification results,
acceptance criteria status, known limitations.
```
