# Acceptance Criteria

## Global acceptance criteria

Every phase must meet these criteria before moving to the next:

- [ ] `pnpm lint` passes with no errors.
- [ ] `pnpm test` passes with no failures.
- [ ] `pnpm build` compiles without TypeScript errors.
- [ ] No secrets are exposed in client code.
- [ ] No Pages Router usage.
- [ ] No broken imports.
- [ ] No duplicate files.
- [ ] Business logic is not in components.
- [ ] Code is maintainable and readable.

## Visual acceptance — applies to every UI phase

- [ ] No hardcoded color literals in components — Tailwind brandbook tokens
      only ([BRANDBOOK.md](BRANDBOOK.md) §18).
- [ ] Background uses the dark radial gradient from BRANDBOOK.md §7.
- [ ] Inter is used for UI; Space Grotesk for numbers / scores / ranking.
- [ ] Cards use the radii and shadows from BRANDBOOK.md §8.
- [ ] Badges (`Live`, `Scheduled`, `Finished`, `Locked`, `Editable`) match
      BRANDBOOK.md §10 exactly.
- [ ] Icons come from `lucide-react` with 2px stroke (§14).
- [ ] Copy never uses betting language (§17).
- [ ] On a 360px viewport every screen is usable without horizontal overflow.

---

## Phase 1 — Project base

- [ ] Next.js App Router project created.
- [ ] TypeScript configured.
- [ ] Tailwind CSS configured.
- [ ] shadcn/ui configured.
- [ ] Vitest configured.
- [ ] Folder structure matches TECHNICAL_ARCHITECTURE.md.
- [ ] .env.example exists.
- [ ] `pnpm dev` starts without errors.
- [ ] `pnpm build` succeeds.
- [ ] Base landing page renders.
- [ ] Tailwind theme includes all brandbook tokens (colors, shadows, radii,
      fonts) from BRANDBOOK.md §18.
- [ ] Inter and Space Grotesk are loaded via `next/font`.
- [ ] Landing page applies the BRANDBOOK.md §7 radial gradient and visibly
      uses brandbook tokens (no leftover Next.js default boilerplate).

## Phase 2 — Supabase schema

- [ ] Initial migration file exists.
- [ ] RLS migration file exists.
- [ ] Seed files exist for teams and mock matches.
- [ ] All 11 tables are defined.
- [ ] UUID primary keys used where defined by DATABASE_SCHEMA.md
      (`app_settings.key` remains a text primary key by design).
- [ ] Foreign keys are correct.
- [ ] Unique constraints match DATABASE_SCHEMA.md.
- [ ] RLS policies allow authenticated reads of public data.
- [ ] RLS policies restrict prediction writes to own user.
- [ ] SQL is syntactically valid.

## Phase 3 — Supabase auth

- [ ] Browser Supabase client exists.
- [ ] Server Supabase client exists.
- [ ] Admin Supabase client exists (server-only).
- [ ] Middleware redirects unauthenticated users.
- [ ] Login page works with email/password.
- [ ] Profile is created on first login.
- [ ] Logout works.
- [ ] SUPABASE_SERVICE_ROLE_KEY is not in client code.

## Phase 4 — UI shell

- [ ] AppShell component exists.
- [ ] Header component exists.
- [ ] BottomNav component exists with fixed positioning.
- [ ] Protected layout wraps authenticated pages.
- [ ] Dashboard page renders with placeholder widgets.
- [ ] Mobile-first dark UI.
- [ ] Navigation between pages works.
- [ ] BottomNav uses the blurred dark style from BRANDBOOK.md §15.
- [ ] Dashboard section order matches BRANDBOOK.md §11.1.
- [ ] CountdownCard, PhaseBadge and RankingCard placeholder exist.

## Phase 5 — Calendar

- [ ] MatchCard component exists.
- [ ] Calendar page reads from Supabase.
- [ ] Matches display date, time, teams, score, status.
- [ ] Phase filter works.
- [ ] Group filter works.
- [ ] Empty state displayed when no matches.
- [ ] All data is typed.

## Phase 6 — Group predictions

- [ ] GroupPredictionEditor component exists.
- [ ] Groups A-L displayed.
- [ ] Teams can be reordered.
- [ ] Predictions saved via Server Action.
- [ ] Server validates exactly 4 teams.
- [ ] Server validates no duplicates.
- [ ] Server validates positions 1-4.
- [ ] Server validates teams belong to group.
- [ ] Server validates phase is not locked.
- [ ] Locked state displayed correctly.
- [ ] Editable state displayed correctly.

## Phase 7 — Scoring and ranking

- [ ] scoring.service.ts exists.
- [ ] ranking.service.ts exists.
- [ ] Exact position = +3 points.
- [ ] Top 2 wrong position = +1 point.
- [ ] Best third = +2 points.
- [ ] Recalculation is idempotent.
- [ ] Ranking sorted by total > knockout > created_at.
- [ ] Top 10 ranking page works.
- [ ] User can see own position.
- [ ] Points breakdown available.
- [ ] Unit tests exist for scoring.
- [ ] Unit tests exist for ranking.
- [ ] Podium top 3 uses gold/silver/bronze treatment from BRANDBOOK.md §11.7.
- [ ] User's own row is pinned and visually highlighted (cyan border + `You`).
- [ ] Point gap copy is shown (e.g. "You're 4 pts behind …").

## Phase 8 — Sync

- [ ] WorldCupProvider interface defined.
- [ ] MockWorldCupProvider works.
- [ ] sync.service.ts upserts data.
- [ ] POST /api/sync protected by CRON_SECRET.
- [ ] Unauthorized requests return 401.
- [ ] sync_runs logged.
- [ ] GitHub Actions workflow file exists.
- [ ] Sync triggers point recalculation.

## Phase 9 — Bracket MVP

- [ ] BracketView component exists.
- [ ] Knockout rounds displayed as columns.
- [ ] Mobile horizontal scroll works.
- [ ] TBD placeholders shown.
- [ ] Prediction selection works when teams known.
- [ ] knockout_predictions stored.
- [ ] Phase locks respected.
- [ ] Final card uses the special premium treatment from BRANDBOOK.md §11.6.
- [ ] Bracket is usable on a 360px viewport (no single giant image).

## Phase 10 — Hardening

- [ ] All services have unit tests.
- [ ] README is complete.
- [ ] Loading states exist.
- [ ] Error states exist.
- [ ] Empty states exist.
- [ ] Locked states exist.
- [ ] Security review passed.
- [ ] Final build passes.

## Phase 11 — Provider chain real

- [ ] ApiFootballProvider implemented.
- [ ] StaticWorldCupProvider implemented.
- [ ] Provider fallback chain works.
- [ ] Provider failures logged.
- [ ] Frontend unchanged.
- [ ] All tests pass.

---

## Post-phase review checklist

After each Codex response, verify:

- [ ] Does it compile?
- [ ] Are there TypeScript errors?
- [ ] Are there broken imports?
- [ ] Are there duplicate files?
- [ ] Has it used Pages Router?
- [ ] Has it exposed private keys?
- [ ] Has it put business logic in components?
- [ ] Has it created tests?
- [ ] Has it respected the phase boundary?
- [ ] Has it added unnecessary dependencies?
- [ ] Is the code maintainable?
