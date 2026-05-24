---
name: provider-sync-guard
description: Use this skill when implementing or reviewing World Cup data providers, sync services, API sync routes, GitHub Actions cron jobs, external API integrations, or mock/static provider chains.
---

# Provider Sync Guard

## Purpose

Ensure the app follows the approved external data architecture:

> External/mock data -> Provider -> Sync service -> Supabase -> Frontend

The frontend must never read directly from providers or external football APIs.

## When to use this skill

Use when working on:

- `/lib/providers`
- provider interfaces
- mock provider
- static provider
- real API provider skeleton
- sync service
- `/app/api/sync/route.ts`
- sync scripts
- GitHub Actions workflow
- `sync_runs`
- external API integration
- provider fallback logic

## Required docs to read first

- `/docs/TECHNICAL_ARCHITECTURE.md`
- `/docs/DATABASE_SCHEMA.md`
- `/docs/CODEX_RULES.md`
- `/docs/IMPLEMENTATION_PLAN.md`

## Required provider interface

All providers must implement:

```ts
interface WorldCupProvider {
  getTeams(): Promise<TeamDTO[]>;
  getMatches(): Promise<MatchDTO[]>;
  getStandings(): Promise<GroupStandingDTO[]>;
}
```

## Provider order

Approved chain:

1. `ApiFootballProvider`
2. `StaticWorldCupProvider`
3. `MockWorldCupProvider`

MVP default:

```env
WORLD_CUP_API_PROVIDER=mock
```

## Data flow rules

- Providers return DTOs.
- Sync service normalizes DTOs.
- Sync service upserts data into Supabase.
- Frontend reads only from Supabase.
- Client Components must not import providers.
- Client Components must not call football APIs.
- External API keys must never reach the browser.

## Sync endpoint rules

For `/app/api/sync/route.ts`:

- Must require `CRON_SECRET`.
- Unauthorized requests must return 401 or 403.
- Must not expose internal stack traces.
- Must log sync success/failure.
- Must call sync service, not duplicate sync logic.
- Must be safe to run repeatedly.

## Sync service rules

`syncWorldCupData()` must:

- select provider from env;
- fetch teams;
- fetch matches;
- fetch standings;
- upsert teams;
- upsert matches;
- upsert group standings;
- log sync in `sync_runs`;
- return a useful summary;
- handle provider errors safely.

## GitHub Actions rules

Workflow should:

- run on schedule only when configured;
- allow manual dispatch;
- call the Vercel/API sync endpoint;
- send `CRON_SECRET`;
- not print secrets;
- fail loudly on non-2xx responses.

## Mock provider rules

The mock provider must:

- work offline;
- return deterministic data;
- be enough to test calendar and scoring;
- not depend on real API availability.

## Static provider rules

The static provider may be a safe skeleton in MVP, but must not fake real external behavior.

## API provider rules

The API provider can be a skeleton in MVP.

If implemented later:

- map external fields to internal DTOs;
- validate required fields;
- handle rate limits and errors;
- never expose the API key client-side.

## Review output format

```md
## Provider/sync review

## Data flow

- ...

## Security findings

- ...

## Idempotency/upsert findings

- ...

## Endpoint findings

- ...

## GitHub Actions findings

- ...

## Required fixes

- ...

## Approved

Yes/No
```

## Definition of done

Provider/sync work is acceptable only if:

- Frontend reads only from Supabase.
- Sync endpoint is secret-protected.
- Provider logic stays in `/lib/providers`.
- Sync logic stays in `/lib/services`.
- Sync is repeatable and logs results.
- Secrets are never exposed.
