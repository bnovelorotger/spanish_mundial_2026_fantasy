---
name: acceptance-test-writer
description: Use this skill when adding, reviewing, or improving tests for a completed project phase, especially service tests, validation tests, scoring tests, and smoke tests.
---

# Acceptance Test Writer

## Purpose

Add practical tests that protect the MVP from regressions without overengineering.

This skill should create the minimum useful test coverage for each phase.

## When to use this skill

Use after or during:

- phase completion;
- service implementation;
- server-side validation;
- scoring logic;
- ranking logic;
- lock logic;
- provider sync logic;
- bug fixes;
- refactors.

## Required docs to read first

- `/docs/ACCEPTANCE_CRITERIA.md`
- `/docs/IMPLEMENTATION_PLAN.md`
- `/docs/CODEX_RULES.md`
- Relevant phase docs

## Testing principles

- Prefer useful tests over high coverage numbers.
- Test business logic more than visual details.
- Keep tests deterministic.
- Avoid real network calls.
- Avoid real external APIs.
- Use mocks/fakes for providers.
- Separate pure logic tests from integration-style tests.
- Do not add brittle snapshot tests unless there is a strong reason.
- Do not test implementation details that will change often.

## Recommended test targets by phase

### Phase 1 — Project base

- Smoke test for basic test setup.
- Build/lint/test scripts exist.

### Phase 2 — Supabase schema

- SQL cannot always be unit-tested locally.
- Add documentation checks where useful.
- Prefer migration review over fake tests.

### Phase 3 — Auth

- Test profile creation helper if extracted.
- Test server-side guards if pure functions exist.

### Phase 4 — Layout/dashboard

- Minimal smoke tests only.
- Avoid brittle visual tests.

### Phase 5 — Calendar

- Test match mapping/view models.
- Test filters by phase/group/status.

### Phase 6 — Group predictions

Test validation:

- exactly 4 teams;
- no duplicates;
- positions 1–4;
- teams belong to group;
- locked phase rejects changes.

### Phase 7 — Scoring/ranking

Must test:

- exact position gives 3;
- top 2 wrong order gives 1;
- best third gives 2;
- unfinished groups do not score;
- recalculation is idempotent;
- ranking tie-breaks.

### Phase 8 — Sync

Test:

- provider selection;
- mock provider returns deterministic data;
- sync summary;
- unauthorized sync request rejected if route logic is testable;
- provider errors are logged safely.

### Phase 9 — Bracket MVP

- Test bracket data grouping by round if logic exists.
- Avoid visual-only tests.

## Vitest conventions

- Use Vitest.
- Place tests near services or in `/tests`.
- Use explicit test names.
- Prefer arrange/act/assert structure.
- Avoid `any`.
- Use fixtures for World Cup entities.

## Output format

```md
## Tests added

- ...

## Behaviors covered

- ...

## Commands run

- `pnpm test`: pass/fail
- `pnpm lint`: pass/fail
- `pnpm build`: pass/fail

## Gaps intentionally not covered

- ...
```

## Definition of done

Testing work is acceptable only if:

- Critical business rules are covered.
- Tests are deterministic.
- Tests do not call external APIs.
- Test names clearly explain behavior.
- `pnpm test` passes or failures are reported with causes.
