# Codex Prompts — Phase by Phase

This file contains the exact prompts to feed to Codex for each phase.
Each prompt is self-contained and references the project docs.

> [!IMPORTANT]
> Never give Codex more than one phase at a time.
> Always review build, structure, and dependencies before moving to the next phase.

---

## Phase 1 — Project base

```txt
You are a senior full-stack developer and product engineer.

We are building a mobile-first World Cup 2026 Pick'em web app with:

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth
- Supabase PostgreSQL
- Supabase RLS
- Vercel
- GitHub Actions
- Vitest

Before coding, read all files inside /docs:

- PRODUCT_SPEC.md
- TECHNICAL_ARCHITECTURE.md
- DATABASE_SCHEMA.md
- SCORING_RULES.md
- IMPLEMENTATION_PLAN.md
- CODEX_RULES.md
- ACCEPTANCE_CRITERIA.md
- ROADMAP.md
- BRANDBOOK.md   ← MANDATORY for any UI work

Your first task is ONLY Phase 1 from IMPLEMENTATION_PLAN.md.

Implement the project base:

1. Create the Next.js App Router structure.
2. Configure TypeScript.
3. Configure Tailwind CSS.
4. Configure shadcn/ui.
5. Configure Vitest.
6. Create the required folder structure.
7. Create .env.example.
8. Add a minimal landing page.
9. Add base styles for dark mobile-first UI per BRANDBOOK.md:
   - Wire every Tailwind token from BRANDBOOK.md §18 (colors, shadows, radii, fonts).
   - Load Inter and Space Grotesk via next/font.
   - Apply the radial-gradient background from BRANDBOOK.md §7 in the root layout.
   - Replace the Next.js default landing page with a minimal Private
     Tournament Mode landing that already uses brandbook tokens (no leftover
     "Get started by editing" boilerplate).
10. Add package scripts:

- dev
- build
- lint
- test
- seed
- sync
- recalculate-points

Important rules:

- Do not implement Supabase yet.
- Do not implement auth yet.
- Do not implement predictions yet.
- Do not implement scoring yet.
- Do not skip TypeScript.
- Do not use Pages Router.
- Do not add unnecessary dependencies.
- Do not expose secrets.
- Do not move to another phase.

At the end, verify:

pnpm lint
pnpm test
pnpm build

If something fails, fix it before saying the task is complete.

Return:

1. Summary of files created/changed.
2. Commands executed.
3. Any known limitations.
4. Confirmation that Phase 1 acceptance criteria are met.
```

---

## Phase 2 — Supabase schema

```txt
Continue with Phase 2 only.

Read:

- /docs/DATABASE_SCHEMA.md
- /docs/SCORING_RULES.md
- /docs/CODEX_RULES.md
- /docs/IMPLEMENTATION_PLAN.md

Implement Supabase database schema.

Create:

/supabase/migrations/001_initial_schema.sql
/supabase/migrations/002_rls.sql
/supabase/seed/seed_teams.sql
/supabase/seed/seed_matches_mock.sql

Required tables:

- profiles
- teams
- matches
- group_standings
- group_predictions
- knockout_predictions
- champion_predictions
- points
- app_settings
- game_locks
- sync_runs

Rules:

- Use uuid primary keys.
- Use gen_random_uuid().
- Use timestamptz.
- Use foreign keys.
- Add unique constraints required for idempotency.
- Add useful indexes.
- Enable RLS.
- Add RLS policies:
  - authenticated users can read teams, matches, group_standings, points, profiles.
  - users can update only their own profile.
  - users can manage only their own predictions.
  - clients cannot write points or matches.
- Do not rely on frontend validation only.
- Do not expose service role.

Seed:

- Create 12 groups A-L.
- Use placeholder teams where needed.
- Support TBD teams.
- Create enough mock matches to test calendar and scoring.
- Create sample group standings for scoring tests.

Do not implement application logic yet.

At the end verify SQL consistency as much as possible.

Return:

1. Summary of schema decisions.
2. Files created.
3. Important constraints.
4. Any limitation.
```

---

## Phase 3 — Supabase auth

```txt
Continue with Phase 3 only.

Implement Supabase client and authentication.

Read:

- /docs/TECHNICAL_ARCHITECTURE.md
- /docs/CODEX_RULES.md
- /docs/IMPLEMENTATION_PLAN.md

Create:

/lib/supabase/client.ts
/lib/supabase/server.ts
/lib/supabase/admin.ts
/middleware.ts
/app/(auth)/login/page.tsx
/app/(protected)/layout.tsx
/app/(protected)/profile/page.tsx

Requirements:

- Use @supabase/ssr.
- Use email/password auth for MVP.
- Protected routes under /(protected) must require auth.
- If user has no profile, create one server-side.
- Do not expose SUPABASE_SERVICE_ROLE_KEY to client.
- Use admin client only server-side.
- Add profile completion logic if username/display_name is missing.
- Add logout action.
- Add clean error states.

Do not implement predictions yet.

At the end run:

pnpm lint
pnpm test
pnpm build

Return:

1. Files changed.
2. Auth flow implemented.
3. Security notes.
4. Verification results.
```

---

## Phase 4 — Layout + Dashboard

```txt
Continue with Phase 4 only.

Read BRANDBOOK.md before writing any component. The visual identity is
"Private Tournament Mode" and is non-negotiable.

Implement mobile-first protected app layout and dashboard.

Create components:

/components/layout/AppShell.tsx
/components/layout/Header.tsx
/components/layout/BottomNav.tsx
/components/worldcup/RankingCard.tsx
/components/worldcup/CountdownCard.tsx
/components/worldcup/PhaseBadge.tsx

Create:

/app/(protected)/dashboard/page.tsx

Dashboard section order (BRANDBOOK.md §11.1):

1. Header with league name.
2. Countdown card.
3. My ranking position.
4. Next match placeholder.
5. CTA for pending predictions.
6. Top ranking placeholder.
7. Activity feed placeholder.

Rules:

- Mobile-first.
- Dark UI per BRANDBOOK.md §7/§8.
- BottomNav uses the blurred dark style from BRANDBOOK.md §15.
- CountdownCard follows BRANDBOOK.md §11.2 (big Space Grotesk numbers,
  cyan/violet glow, amber when low, red when critical).
- PhaseBadge follows BRANDBOOK.md §10.
- Responsive desktop layout, but mobile is primary.
- Use shadcn/ui primitives where appropriate, but restyle them with
  brandbook tokens — no leftover shadcn defaults.
- No fake business logic yet.
- Use typed mock view models if needed.

At the end run:

pnpm lint
pnpm test
pnpm build

Return summary and verification.
```

---

## Phase 5 — Calendar

```txt
Continue with Phase 5 only.

Read BRANDBOOK.md before writing any component.

Implement match calendar using Supabase data.

Create/update:

/lib/types/worldcup.ts
/lib/services/matches.service.ts
/components/worldcup/MatchCard.tsx
/components/worldcup/TeamBadge.tsx
/app/(protected)/calendar/page.tsx

Requirements:

- Read matches from Supabase.
- Join teams for home and away names.
- Display date, time, city, stadium, phase, group, teams, score and status.
- MatchCard must implement both compact and premium variants from
  BRANDBOOK.md §11.3.
- Match status badges (LIVE / Scheduled / Finished / Locked) must match
  BRANDBOOK.md §10 exactly. LIVE pulses softly.
- Group accent colors from BRANDBOOK.md §5 are used as borders/badges only —
  never as full backgrounds.
- Scores use Space Grotesk (BRANDBOOK.md §6).
- Add filters by phase and group.
- Use MatchStatus type:
  - SCHEDULED
  - LIVE
  - FINISHED
  - POSTPONED
  - CANCELLED

Rules:

- Frontend only reads from Supabase.
- No external API calls.
- Empty state uses human copy per BRANDBOOK.md §12.
- Mobile-first cards.
- Type all data.

At the end run:

pnpm lint
pnpm test
pnpm build

Return summary and verification.
```

---

## Phase 6 — Group predictions

```txt
Continue with Phase 6 only.

Read BRANDBOOK.md before writing any component.
GroupPredictionEditor must follow BRANDBOOK.md §11.5: top border in the
group's accent color (§5), draggable team rows, visible drag handle, tactile
feedback (motion §13), and clear Editable / Locked / Saved badges (§10).
The "Save" button uses the primary gradient pill from BRANDBOOK.md §9.

Implement group predictions.

Create/update:

/lib/services/predictions.service.ts
/lib/services/locks.service.ts
/lib/utils/locks.ts
/components/worldcup/GroupTable.tsx
/components/worldcup/GroupPredictionEditor.tsx
/app/(protected)/predictions/page.tsx

Requirements:

- Show groups A-L.
- Show 4 teams per group.
- Allow user to reorder teams with up/down buttons.
- Save predictions with Server Action.
- Validate server-side:
  - exactly 4 teams;
  - no duplicate teams;
  - positions are 1, 2, 3, 4;
  - all teams belong to that group;
  - phase is not locked.
- Store predictions in group_predictions.
- Show state:
  - Editable
  - Locked
  - Pending
  - Completed

Lock rules:

- GROUP_STAGE locks at first group stage kickoff.
- Manual game_locks override must be respected.

Do not implement scoring yet.

At the end run:

pnpm lint
pnpm test
pnpm build

Return summary and verification.
```

---

## Phase 7 — Scoring + ranking

```txt
Continue with Phase 7 only.

Implement scoring and ranking.

Read:

- /docs/SCORING_RULES.md
- /docs/BRANDBOOK.md   ← especially §11.7 (Ranking) and §6 (Typography)

The ranking page is the visual hero of the app. It must implement:
- Podium for top 3 with gold/silver/bronze treatment.
- The current user's row pinned and highlighted with cyan border + `You`.
- Movement arrows and point gap copy ("You're 4 pts behind …").
- All point counters and positions in Space Grotesk Bold.
- Prediction stamps (`+3 pts`, `Miss`, `Exact`) per BRANDBOOK.md §16.

Create/update:

/lib/services/scoring.service.ts
/lib/services/ranking.service.ts
/scripts/recalculate-points.ts
/components/worldcup/RankingTable.tsx
/components/worldcup/RankingCard.tsx
/app/(protected)/ranking/page.tsx
/app/(protected)/dashboard/page.tsx

Scoring rules:

Group stage:
- +3 if exact group position is correct.
- +1 if team finishes top 2 but predicted position is different.
- +2 if team was predicted 3rd and qualified as BEST_THIRD.

Rules:

- Use group_standings as source of truth.
- Do not score groups without standings.
- Do not duplicate points.
- recalculateAllPoints() must be idempotent.
- Delete/recalculate points safely by source_type or upsert deterministic rows.
- Save reason text.
- Save metadata jsonb if column exists.
- Do not score unfinished/unavailable data.

Ranking:

Implement:

- getTopRanking(limit = 10)
- getUserRankingPosition(userId)
- getUserPointsBreakdown(userId)
- getRankingByPhase()

Tie-break:

1. total points desc
2. knockout points desc
3. profile created_at asc

Add unit tests for:

- exact position gives 3
- top 2 wrong order gives 1
- best third gives 2
- recalculation is idempotent
- ranking sorts correctly

At the end run:

pnpm lint
pnpm test
pnpm build

Return summary and verification.
```

---

## Phase 8 — Sync + GitHub Action

```txt
Continue with Phase 8 only.

Implement mock sync system and protected sync endpoint.

Create/update:

/lib/providers/worldcup-provider.types.ts
/lib/providers/mock-worldcup-provider.ts
/lib/providers/static-worldcup-provider.ts
/lib/providers/api-football-provider.ts
/lib/services/sync.service.ts
/app/api/sync/route.ts
/scripts/sync-worldcup-data.ts
/.github/workflows/sync-worldcup.yml

Provider interface:

interface WorldCupProvider {
  getTeams(): Promise<TeamDTO[]>;
  getMatches(): Promise<MatchDTO[]>;
  getStandings(): Promise<GroupStandingDTO[]>;
}

Provider chain:

1. ApiFootballProvider
2. StaticWorldCupProvider
3. MockWorldCupProvider

MVP behavior:

- WORLD_CUP_API_PROVIDER=mock by default.
- ApiFootballProvider can be a safe skeleton.
- Static provider can be a safe skeleton.
- Mock provider must work.

syncWorldCupData() must:

- get teams
- get matches
- get standings
- upsert teams
- upsert matches
- upsert group_standings
- log sync_runs
- call recalculateAllPoints() if standings/results changed
- be idempotent

POST /api/sync:

- requires Authorization: Bearer CRON_SECRET
- returns 401 if missing/wrong
- runs syncWorldCupData()
- runs recalculateAllPoints()
- returns JSON summary

GitHub Action:

- workflow_dispatch
- cron every 6 hours
- curl POST $APP_URL/api/sync
- Authorization Bearer $CRON_SECRET

At the end run:

pnpm lint
pnpm test
pnpm build

Return summary and verification.
```

---

## Phase 9 — Bracket MVP

```txt
Continue with Phase 9 only.

Read BRANDBOOK.md §11.6 before writing any component. The bracket must NOT
be a single giant image — it must be readable and interactive on a 360px
viewport using tabs per round or horizontal scroll with one column per
round. The Final card gets the special premium treatment from §11.6.

Implement bracket MVP visual, not advanced dynamic propagation yet.

Create/update:

/components/worldcup/BracketView.tsx
/components/worldcup/BracketPredictionEditor.tsx
/app/(protected)/predictions/page.tsx
/lib/services/bracket.service.ts

Requirements:

- Add tabs in predictions page:
  - Groups
  - Knockout
- Knockout tab shows rounds:
  - Round of 32
  - Round of 16
  - Quarter-finals
  - Semi-finals
  - Final
- Mobile horizontal scroll.
- Each round is a column.
- Each match is a card.
- Show teams if available.
- Show placeholder slots if teams are TBD:
  - Winner Group A
  - Runner-up Group B
  - Best third X
- Allow selecting predicted winner only if both teams are known.
- Store in knockout_predictions.
- Respect phase locks.
- Show if prediction is_random.

Do not implement automatic propagation yet unless simple and safe.

At the end run:

pnpm lint
pnpm test
pnpm build

Return summary and verification.
```

---

## Phase 10 — Tests + README + hardening

```txt
Continue with Phase 10 only.

Finalize MVP quality.

Visual sweep — for every screen, verify against BRANDBOOK.md §12 and §19.
Empty / loading / error states must follow §12 (human copy, dark skeletons,
no generic spinners).

Tasks:

1. Add or improve tests:
   - scoring.service.test.ts
   - ranking.service.test.ts
   - locks.test.ts
   - bracket.service.test.ts where applicable

2. Improve README:
   - project description
   - stack
   - setup local
   - Supabase setup
   - migrations
   - seed
   - env vars
   - dev server
   - Vercel deploy
   - GitHub Actions
   - provider switching
   - roadmap

3. Improve UI states:
   - loading
   - empty
   - error
   - locked
   - editable
   - completed

4. Verify security:
   - no service role in client
   - no secrets committed
   - protected routes work
   - sync endpoint protected

5. Verify final commands:
   pnpm lint
   pnpm test
   pnpm build

Return:

- Final MVP summary.
- What works.
- What is intentionally deferred.
- Known limitations.
- Deployment checklist.
```

---

## Phase 11 — Provider real

```txt
Implement Phase 11: real provider chain.

Goal:

Keep frontend unchanged. All real data must be normalized into Supabase.

Provider order:

1. ApiFootballProvider
2. StaticWorldCupProvider
3. MockWorldCupProvider

Requirements:

- ApiFootballProvider reads WORLD_CUP_API_KEY.
- If API key is missing, skip safely.
- If API provider fails, continue to static provider.
- If static provider fails, continue to mock provider.
- Never crash full sync if one provider fails.
- Log provider failures in sync_runs summary.
- Normalize all provider responses into TeamDTO, MatchDTO and GroupStandingDTO.
- Do not change frontend pages.
- Add tests for provider fallback.

Do not implement scraper yet.

At the end run:

pnpm lint
pnpm test
pnpm build
```

---

## Post-phase review checklist

After each Codex response, verify:

```txt
¿Compila?                                    → pnpm build
¿Hay errores TypeScript?                     → pnpm lint
¿Hay imports rotos?                          → check console output
¿Hay archivos duplicados?                    → ls -R
¿Ha usado Pages Router?                      → grep "pages/" -r
¿Ha expuesto claves privadas?                → grep "SERVICE_ROLE" -r src/
¿Ha metido lógica de negocio en componentes? → review /components
¿Ha creado tests?                            → ls tests/
¿Ha respetado la fase?                       → review diff
¿Ha añadido dependencias innecesarias?       → diff package.json
¿El código es mantenible?                    → code review
```
