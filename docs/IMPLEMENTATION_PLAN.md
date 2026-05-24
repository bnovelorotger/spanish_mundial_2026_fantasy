# Implementation Plan

> Every UI-touching phase (1, 4, 5, 6, 7, 9, 10) must comply with
> [BRANDBOOK.md](BRANDBOOK.md). It is the source of truth for design.

## Phase 1 — Project base

- Create Next.js App Router project.
- Add TypeScript.
- Add Tailwind CSS.
- Add shadcn/ui.
- Add Vitest.
- Add base folder structure.
- Add .env.example.
- **Wire the full Tailwind theme from [BRANDBOOK.md](BRANDBOOK.md) §18**
  (colors, shadows, radii, fonts). Load Inter and Space Grotesk.
- Apply the dark radial-gradient background from BRANDBOOK.md §7 to the root
  layout. The landing page must already feel like Private Tournament Mode.

Acceptance:

- `pnpm dev` works.
- `pnpm build` works.
- Base home page renders.
- All brandbook tokens are available as Tailwind utilities.
- Fonts load correctly (Inter + Space Grotesk).

---

## Phase 2 — Supabase schema

- Add initial migration.
- Add RLS migration.
- Add seed files.
- Add profiles, teams, matches, standings, predictions, points, locks, sync_runs.

Acceptance:

- SQL migrations are valid.
- Seed files exist.
- Schema supports MVP flows.

---

## Phase 3 — Supabase auth

- Add browser client.
- Add server client.
- Add admin client.
- Add middleware.
- Add login page.
- Add profile creation logic.

Acceptance:

- User can log in.
- Protected pages require auth.
- Profile exists after first login.

---

## Phase 4 — UI shell

- AppShell.
- Header.
- BottomNav — exact spec in [BRANDBOOK.md](BRANDBOOK.md) §15.
- Protected layout.
- Basic dashboard — section order from BRANDBOOK.md §11.1.
- CountdownCard (§11.2), PhaseBadge (§10), RankingCard placeholder (§11.7).

Acceptance:

- Mobile navigation works.
- Dashboard renders authenticated user data.
- Brandbook palette, typography, radii and shadows are used throughout.

---

## Phase 5 — Calendar

- MatchCard — visual spec in [BRANDBOOK.md](BRANDBOOK.md) §11.3 (compact +
  premium variants, badges for `LIVE`/`Scheduled`/`Finished` per §10).
- Calendar page.
- Filters by phase and group.
- Mock matches from Supabase.
- Use group accent colors (§5) as borders/badges, never as full backgrounds.

Acceptance:

- User can see mock World Cup calendar.
- Match status badges match BRANDBOOK.md §10.

---

## Phase 6 — Group predictions

- GroupPredictionEditor — visual spec in [BRANDBOOK.md](BRANDBOOK.md) §11.5
  (top border in group accent, draggable rows, visible drag handle, tactile
  feedback).
- Save group predictions.
- Validate predictions server-side.
- Respect lock state — `Editable` / `Locked` badge per BRANDBOOK.md §10.
- Saved state shows the check animation from BRANDBOOK.md §13.

Acceptance:

- User can save group order.
- Invalid predictions are rejected.
- Locked phase cannot be edited.
- Editable / Locked / Saved states are visually obvious per brandbook §10/§12.

---

## Phase 7 — Scoring and ranking

- scoring.service.ts.
- ranking.service.ts.
- points breakdown.
- ranking page — full visual treatment per [BRANDBOOK.md](BRANDBOOK.md) §11.7:
  podium for top 3 (gold/silver/bronze glow), pinned user row with cyan
  border and `You` label, movement arrows, point gap copy
  ("You're 4 pts behind …").
- dashboard ranking widgets.
- Use Space Grotesk for all point counters and ranking numbers (§6).

Acceptance:

- Points recalculate idempotently.
- Ranking displays correctly.
- Top 10 works.
- Podium and user-row treatment matches BRANDBOOK.md §11.7.

---

## Phase 8 — Sync

- Mock provider.
- sync.service.ts.
- POST /api/sync.
- CRON_SECRET protection.
- sync_runs logging.
- GitHub Actions workflow.

Acceptance:

- Sync endpoint works.
- Unauthorized requests fail.
- Authorized requests update data.

---

## Phase 9 — Bracket MVP

- Static visual bracket — mobile-first per [BRANDBOOK.md](BRANDBOOK.md) §11.6
  (tabs per round OR horizontal scroll, compact cards, subtle connectors).
- Knockout matches display.
- Final card gets the special premium treatment from BRANDBOOK.md §11.6.
- Prediction types prepared.
- No complex propagation required yet.

Acceptance:

- Bracket page section exists.
- Mobile horizontal scroll works.
- No single giant image — usable on a 360px viewport.

---

## Phase 10 — Hardening

- Tests.
- README.
- Error states — human copy per [BRANDBOOK.md](BRANDBOOK.md) §12.
- Loading states — dark skeletons, no generic spinners (§12).
- Empty states — engagement copy, never "No data" (§12).
- Final build check.
- Sweep every screen against BRANDBOOK.md §19 (non-negotiable rules).

Acceptance:

- `pnpm lint` passes.
- `pnpm test` passes.
- `pnpm build` passes.
- Empty / loading / error states everywhere comply with BRANDBOOK.md §12.

---

## Phase 11 — Provider chain real

- ApiFootballProvider implementation.
- StaticWorldCupProvider implementation.
- Provider fallback chain.
- Provider failure logging.

Acceptance:

- Provider chain works with fallback.
- Frontend unchanged.
- Tests pass.
