# Roadmap

## MVP 1 — Core Pick'em

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
- [ ] Phase 10: README + hardening.
- [ ] Deploy to Vercel.

### Block 6 (Day 6)
- [x] Phase 9: Bracket MVP visual.

### Block 7 (Day 7)
- [ ] Phase 11: Real provider chain.

---

## MVP 2 — Enhanced experience (future)

- Full dynamic knockout bracket with propagation.
- Real-time match updates.
- Push notifications.
- Social features (groups, leagues).
- Match result predictions (exact score).
- Admin panel.
- Detailed statistics.

## MVP 3 — Monetization (future)

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
