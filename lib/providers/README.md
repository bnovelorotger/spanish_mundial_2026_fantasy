# lib/providers

External data providers. All providers normalize to the same DTOs so the rest of
the app does not care where the data came from.

Expected files (Phase 8 skeletons → Phase 11 real impl):

- `worldcup-provider.types.ts` — `WorldCupProvider` interface and DTOs.
- `mock-worldcup-provider.ts` — Local mock data. Default in MVP 1.
- `static-worldcup-provider.ts` — Bundled static JSON fallback.
- `api-football-provider.ts` — Real API. Skeleton in Phase 8, real in Phase 11.

Interface contract:

```ts
interface WorldCupProvider {
  getTeams(): Promise<TeamDTO[]>;
  getMatches(): Promise<MatchDTO[]>;
  getStandings(): Promise<GroupStandingDTO[]>;
}
```

Fallback chain (Phase 11): `ApiFootball → Static → Mock`. A single provider
failure must never crash the sync — log and continue.

Rules:

- Providers run **server-only**.
- Providers do not touch Supabase — they only return normalized DTOs.
- `sync.service.ts` is the only consumer.
