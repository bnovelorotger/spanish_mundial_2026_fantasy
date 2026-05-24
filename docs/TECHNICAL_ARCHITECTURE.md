# Technical Architecture

## Stack

- Next.js App Router.
- TypeScript.
- Tailwind CSS (v4).
- shadcn/ui.
- Framer Motion (animations — added in Phase 4).
- Lucide React (icons — added in Phase 4).
- Inter + Space Grotesk (via `next/font`, added in Phase 1).
- Supabase PostgreSQL.
- Supabase Auth.
- Supabase RLS.
- Vercel.
- GitHub Actions.
- Vitest for unit tests.

## Visual system

All design decisions (colors, typography, spacing, radii, shadows, motion,
copy) are defined in [BRANDBOOK.md](BRANDBOOK.md) — internal codename
**Private Tournament Mode**. It is mandatory reading before any UI work and
the Tailwind theme defined in §18 must be wired during Phase 1.

## Architecture rules

- Use App Router only.
- Do not use Pages Router.
- Use Server Components by default.
- Use Client Components only when interactivity is required.
- Use Server Actions for authenticated mutations.
- Use Route Handlers for machine-to-machine endpoints.
- Use Supabase as the only frontend data source.
- Do not call external football APIs from client components.
- Do not expose service role key to the browser.
- Keep business logic inside `/lib/services`.
- Keep provider logic inside `/lib/providers`.
- Keep reusable UI inside `/components`.

## Folder structure

```
/app
  /(auth)
    /login
      page.tsx
  /(protected)
    /dashboard
      page.tsx
    /predictions
      page.tsx
    /calendar
      page.tsx
    /ranking
      page.tsx
    /profile
      page.tsx
  /api
    /sync
      route.ts

/components
  /layout
  /worldcup
  /ui

/lib
  /supabase
  /services
  /providers
  /utils
  /types

/scripts

/supabase
  /migrations
  /seed

/tests

/.github
  /workflows
```

## Backend services

Required services:

- matches.service.ts
- predictions.service.ts
- scoring.service.ts
- ranking.service.ts
- sync.service.ts
- locks.service.ts
- standings.service.ts

## Provider architecture

All providers must implement:

```typescript
interface WorldCupProvider {
  getTeams(): Promise<TeamDTO[]>;
  getMatches(): Promise<MatchDTO[]>;
  getStandings(): Promise<GroupStandingDTO[]>;
}
```

Provider order:

1. ApiFootballProvider
2. StaticWorldCupProvider
3. MockWorldCupProvider

MVP 1 must use MockWorldCupProvider by default.

## Data flow

```
External/mock data -> Provider -> Sync service -> Supabase -> Frontend
```

The frontend must never read directly from providers.
