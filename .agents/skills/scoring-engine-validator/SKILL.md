---
name: scoring-engine-validator
description: Use this skill when implementing or reviewing group scoring, points recalculation, ranking logic, tie-breaks, or tests for the World Cup Pick'em scoring engine.
---

# Scoring Engine Validator

## Purpose

Ensure that the World Cup Pick'em scoring system is correct, deterministic, idempotent, and tested.

## When to use this skill

Use when working on:

- `scoring.service.ts`
- `ranking.service.ts`
- `recalculate-points` scripts
- `points` table writes
- ranking pages/widgets
- points breakdown
- scoring tests
- any change to `/docs/SCORING_RULES.md`

## Required docs to read first

- `/docs/SCORING_RULES.md`
- `/docs/DATABASE_SCHEMA.md`
- `/docs/CODEX_RULES.md`
- `/docs/IMPLEMENTATION_PLAN.md`

## Group stage scoring rules

For each group prediction:

- +3 points if exact group position is correct.
- +1 point if the team finishes in top 2 but the predicted position is different.
- +2 points if the team is predicted 3rd and qualifies as best third.

Rules:

- Use `group_standings` as source of truth.
- Do not calculate MVP group standings from raw matches.
- Do not score unfinished groups.
- Do not score unavailable/incomplete data.
- Do not duplicate points.
- Save one deterministic points row per scored prediction source.
- Use reason text.
- Use metadata jsonb if available.

## Idempotency requirements

`recalculateAllPoints()` must be idempotent.

Acceptable strategies:

1. Upsert deterministic rows using:
   - `user_id`
   - `source_type`
   - `source_id`

2. Or safely delete and recalculate only the relevant source type.

Do not append duplicate rows.

## Ranking rules

Ranking order:

1. Total points descending.
2. Knockout points descending.
3. Older `profile.created_at` first.

Required functions:

- `getTopRanking(limit = 10)`
- `getUserRankingPosition(userId)`
- `getUserPointsBreakdown(userId)`
- `getRankingByPhase()`

## Required tests

Add or preserve unit tests for:

- exact position gives 3 points;
- top 2 wrong order gives 1 point;
- predicted 3rd and best third gives 2 points;
- unfinished groups do not score;
- recalculation is idempotent;
- ranking sorts by total points desc;
- ranking tie-break uses knockout points desc;
- final tie-break uses older profile first.

## Implementation rules

- Keep pure scoring functions separate from database writes where possible.
- Prefer deterministic pure functions for unit tests.
- Avoid hidden mutable state.
- Avoid hardcoded user IDs in services.
- Do not use `any`.
- Do not mix UI with scoring logic.
- Do not score knockout rounds in MVP unless explicitly requested.

## Output format

At the end of scoring work, return:

```md
## Scoring validation

## Rules implemented

- ...

## Idempotency strategy

- ...

## Ranking strategy

- ...

## Tests added/updated

- ...

## Verification

- `pnpm test`: pass/fail
- `pnpm lint`: pass/fail
- `pnpm build`: pass/fail

## Risks or limitations

- ...
```

## Definition of done

Scoring is acceptable only if:

- Rules match `/docs/SCORING_RULES.md`.
- Recalculation is idempotent.
- Ranking tie-breaks are implemented.
- Tests cover the critical cases.
- Points are not duplicated.
