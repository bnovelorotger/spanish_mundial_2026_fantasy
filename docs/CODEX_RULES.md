# Codex Rules

You are working on a production-oriented MVP.

> **Skills:** repo-scoped Codex skills live in [`.agents/skills/`](../.agents/skills/).
> See [SKILLS_USAGE.md](SKILLS_USAGE.md) for which skill to invoke per task.
> At minimum, every phase task must invoke `$project-phase-guardian`.

## Absolute rules

- Do not remove existing working code without reason.
- Do not expose secrets.
- Do not use SUPABASE_SERVICE_ROLE_KEY in client code.
- Do not call external APIs from frontend.
- Do not skip TypeScript types.
- Do not leave TODOs for required MVP functionality.
- Do not create fake successful behavior.
- Do not continue to the next phase if build, lint or tests fail.
- Do not use Pages Router.
- Do not introduce unnecessary dependencies.
- Prefer simple, maintainable code.

## Before finishing each task

Run or make sure the following can run:

```bash
pnpm lint
pnpm test
pnpm build
```

If any command fails, fix the issue before reporting completion.

## Coding style

- Use TypeScript strictly.
- Use named exports for services.
- Keep functions small.
- Separate UI from business logic.
- Validate all mutations server-side.
- Prefer explicit types over `any`.
- Use Zod for input validation where useful.

## UX rules

- Mobile-first.
- Dark background.
- Clear cards.
- Clear empty states.
- Clear loading states.
- Clear locked/editable states.

## Visual rules — Brandbook compliance

The visual identity is **Private Tournament Mode**, fully specified in
[BRANDBOOK.md](BRANDBOOK.md). It is mandatory reading before any UI work.

- Use the exact color, typography, spacing, radius, shadow and motion tokens
  defined in BRANDBOOK.md §4 → §18.
- All Tailwind color/shadow/radius tokens listed in BRANDBOOK.md §18 must
  exist in the project theme by the end of Phase 1.
- Never invent a new color, gradient, or radius scale — if something is
  missing, propose an addition to the brandbook instead of bypassing it.
- Vivid colors are accents only — never used as the dominant background of
  a screen or card.
- No betting / casino / FIFA-clone / corporate-dashboard aesthetics. See
  BRANDBOOK.md §1 and §19 for the explicit negative list.
- Cards are the dominant visual unit. Ranking is a hero element.
- Predictions must feel like playable cards (BRANDBOOK.md §11.4 / §11.5).
- Every state (`empty`, `loading`, `error`, `locked`, `editable`, `live`,
  `finished`, `correct`, `wrong`) must be visually distinct per
  BRANDBOOK.md §12.
- Use Lucide React stroke icons only (BRANDBOOK.md §14).
- Copy must avoid betting language (BRANDBOOK.md §17).

## Database rules

- Migrations must be deterministic.
- Seed must be repeatable where possible.
- Use upserts for sync.
- Use idempotent scoring.

## File organization rules

- Business logic goes in `/lib/services`.
- Provider logic goes in `/lib/providers`.
- Shared types go in `/lib/types`.
- Supabase clients go in `/lib/supabase`.
- Utility functions go in `/lib/utils`.
- UI components go in `/components`.
- Layout components go in `/components/layout`.
- World Cup specific components go in `/components/worldcup`.
- shadcn/ui components go in `/components/ui`.

## Security rules

- Never expose SUPABASE_SERVICE_ROLE_KEY to the browser.
- Always validate mutations server-side.
- Use RLS as a second layer of defense.
- Protect sync endpoint with CRON_SECRET.
- Never commit .env files.
- Always use .env.example for documentation.

## Testing rules

- Write unit tests for services.
- Test scoring idempotency.
- Test validation logic.
- Test ranking tie-breaks.
- Use Vitest.
