# Roadmap

## MVP 1 - Core Pick'em

### Block 1 (Day 1)
- [x] Create project documentation.
- [x] Phase 1: Project base.
- [x] Phase 2: Supabase schema.

### Block 2 (Day 2)
- [x] Phase 3: Supabase auth.
- [x] Phase 4: UI shell + dashboard.

### Block 3 (Day 3)
- [x] Phase 5: Calendar.
- [x] Phase 6: Group predictions.

### Block 4 (Day 4)
- [x] Phase 7: Scoring + ranking.
- [x] Tests for scoring and ranking.

### Block 5 (Day 5)
- [x] Phase 8: Sync + GitHub Action.
- [x] Phase 10: README + hardening.
- [x] Deploy to Vercel.

### Block 6 (Day 6)
- [x] Phase 9: Bracket MVP visual.

### Block 7 (Day 7)
- [x] Phase 11: Real provider chain.

> **MVP 1 complete.** All 11 phases plus deployment landed on `main`.

### Post-MVP polish window (2026-05-25 -> 2026-05-31)

After MVP 1 shipped, a polish window addressed real-user friction and a
full frontend audit. Closed in waves:

- **Real data wiring**: football-data.org as top-of-chain provider, real
  team flags via flagcdn, profile avatars (uploaded photo + team crest)
  rendering across ranking surfaces.
- **i18n**: full app translated to peninsular Spanish (`es-ES`), with
  auth toasts replacing legacy banners.
- **First-visit onboarding**: 5-page coach-mark tour with split per
  subtab in Predicciones, persisted in localStorage.
- **Audit `docs/AUDIT_FRONTEND_2026-05-27.md`** with 17 findings,
  triaged by cross-review (1 discarded as false positive, 11 P1, 5 P2).
  14 of the actionable findings executed in 5 waves: i18n closure,
  fast a11y, onboarding fixes, deeper a11y (focus-visible + semantic
  ranking + radio group avatars), and microcopy editorial polish.
- **Live scoring**: `GROUP_POSITION` now evaluates against current
  standings instead of waiting for `is_final = true`. Cron raised to
  hourly (72 calls/day, well below TIER_ONE's 10 calls/minute). UI
  shows an `EN DIRECTO` badge while any group standings remain open.
- **Knockout v1**: two fixed editing windows, in-app 24h lock alerts,
  slot-based bracket picks, `winner_side` support, `KNOCKOUT_WINNER`
  scoring, and champion bonus inferred from the final pick.

What was *intentionally* left for later:

- F-002 / F-012 (audit) - tournament-aware editorial copy. Will be
  taken on closer to June 2026, when the actual phase of the tournament
  matters.
- F-008 / F-013 (audit) - debated; the auditor advised against them.
- F-016 closed as part of the microcopy wave above.

---

## MVP 2 - Enhanced experience (future)

- Full dynamic knockout bracket propagation between rounds.
- Real-time match updates.
- Push notifications.
- Social features (groups, leagues).
- Match result predictions (exact score, extra time, penalties bonuses).
- Admin panel.
- Detailed statistics.

## MVP 3 - Monetization (future)

- Premium leagues.
- Custom tournament creation.
- API for third parties.

---

## Working principles

1. **Never skip phases.** Each phase builds on the previous one.
2. **Always verify.** Run lint, test, and build after each phase.
3. **Keep it simple.** MVP means minimum viable product.
4. **Mobile first.** Every UI decision starts with mobile.
5. **Dark and sporty.** The visual identity is a dark sports dashboard.
6. **Normalized data.** Frontend only reads from Supabase, never from external APIs.
7. **Idempotent operations.** Sync and scoring must be safe to run multiple times.
