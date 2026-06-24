# Codex Skills Usage Guide

This project uses repo-scoped Codex skills to keep implementation consistent,
reduce scope creep, and protect critical architecture decisions.

## Skills location

Skills live in:

```txt
.agents/skills/
```

Each skill is a folder with a required `SKILL.md`.

## Available skills

### 1. project-phase-guardian

Use for every phase implementation or phase review.

Trigger examples:

```txt
Use $project-phase-guardian. Continue with Phase 4 only.
```

```txt
Use $project-phase-guardian. Review whether Phase 6 meets acceptance criteria.
```

### 2. supabase-rls-reviewer

Use whenever database, auth, RLS, migrations, server actions, or security are involved.

Trigger examples:

```txt
Use $supabase-rls-reviewer. Review the Supabase migrations and RLS policies.
```

```txt
Use $supabase-rls-reviewer before finishing Phase 3.
```

### 3. scoring-engine-validator

Use for scoring, points, ranking, tie-breaks, and recalculation logic.

Trigger examples:

```txt
Use $scoring-engine-validator. Implement Phase 7 scoring and ranking only.
```

```txt
Use $scoring-engine-validator. Check whether recalculateAllPoints is idempotent.
```

### 4. mobile-sports-ui-reviewer

Use for all UI work.

Trigger examples:

```txt
Use $mobile-sports-ui-reviewer. Review the dashboard UI against the brandbook.
```

```txt
Use $mobile-sports-ui-reviewer. Implement the Ranking page with the approved visual direction.
```

### 5. provider-sync-guard

Use for providers, sync endpoint, GitHub Actions, and external data flow.

Trigger examples:

```txt
Use $provider-sync-guard. Implement Phase 8 sync with mock provider only.
```

```txt
Use $provider-sync-guard. Review that the frontend never reads directly from providers.
```

### 6. acceptance-test-writer

Use after phase implementation or when adding tests for business rules.

Trigger examples:

```txt
Use $acceptance-test-writer. Add minimum useful tests for Phase 6.
```

```txt
Use $acceptance-test-writer. Add scoring tests for Phase 7.
```

## Recommended skill usage by phase

| Phase                          | Required skills                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------------------ |
| Phase 1 — Project base         | project-phase-guardian, mobile-sports-ui-reviewer                                                |
| Phase 2 — Supabase schema      | project-phase-guardian, supabase-rls-reviewer                                                    |
| Phase 3 — Supabase auth        | project-phase-guardian, supabase-rls-reviewer                                                    |
| Phase 4 — Layout + dashboard   | project-phase-guardian, mobile-sports-ui-reviewer                                                |
| Phase 5 — Calendar             | project-phase-guardian, mobile-sports-ui-reviewer                                                |
| Phase 6 — Group predictions    | project-phase-guardian, supabase-rls-reviewer, mobile-sports-ui-reviewer, acceptance-test-writer |
| Phase 7 — Scoring + ranking    | project-phase-guardian, scoring-engine-validator, acceptance-test-writer                         |
| Phase 8 — Sync + GitHub Action | project-phase-guardian, provider-sync-guard, supabase-rls-reviewer                               |
| Phase 9 — Bracket MVP          | project-phase-guardian, mobile-sports-ui-reviewer                                                |
| Phase 10 — Hardening           | project-phase-guardian, acceptance-test-writer, mobile-sports-ui-reviewer                        |
| Phase 11 — Provider chain real | project-phase-guardian, provider-sync-guard, supabase-rls-reviewer                               |

## Standard implementation prompt

Use this format for every phase:

```txt
Use $project-phase-guardian.

Continue with Phase [X] only.

Before coding, read:
- /docs/IMPLEMENTATION_PLAN.md
- /docs/CODEX_RULES.md
- /docs/ACCEPTANCE_CRITERIA.md
- /docs/BRANDBOOK.md   (if the phase touches UI)
- any docs relevant to this phase

Do not implement future phases.
Do not add unnecessary dependencies.
Do not skip verification.

At the end run:
- pnpm lint
- pnpm test
- pnpm build

Return:
1. Files changed
2. What was implemented
3. Verification results
4. Acceptance criteria status
5. Known limitations
```

## Standard review prompt

```txt
Use $project-phase-guardian.

Review Phase [X] against:
- /docs/IMPLEMENTATION_PLAN.md
- /docs/CODEX_RULES.md
- /docs/ACCEPTANCE_CRITERIA.md

Do not change code unless needed to fix clear issues.

Return:
1. Missing requirements
2. Scope creep found
3. Security risks
4. Test/build status
5. Required fixes
```

## UI review prompt

```txt
Use $mobile-sports-ui-reviewer.

Review the current UI against the approved brandbook (/docs/BRANDBOOK.md).

Focus on:
- mobile-first layout
- dark premium sports broadcast feel
- cards
- badges
- ranking prominence
- prediction states
- match states
- avoiding betting/casino/corporate dashboard aesthetics

Return specific changes required.
```

## Supabase review prompt

```txt
Use $supabase-rls-reviewer.

Review the current Supabase schema, migrations, RLS policies, and Supabase clients.

Check:
- RLS
- ownership
- service role safety
- client/server separation
- constraints
- indexes
- idempotency
- prediction write safety
- points write safety

Return critical issues first.
```

## Scoring review prompt

```txt
Use $scoring-engine-validator.

Review scoring and ranking logic.

Check:
- +3 exact position
- +1 top 2 wrong order
- +2 best third
- unfinished groups not scored
- idempotency
- ranking tie-breaks
- tests

Return required fixes and whether it is approved.
```

## Provider sync review prompt

```txt
Use $provider-sync-guard.

Review provider and sync architecture.

Check:
- frontend reads only from Supabase
- providers are server-side only
- mock provider works by default
- sync endpoint is protected by CRON_SECRET
- sync is idempotent
- sync_runs logs success/failure
- GitHub Actions does not expose secrets

Return required fixes.
```

## Testing prompt

```txt
Use $acceptance-test-writer.

Add minimum useful tests for Phase [X].

Prioritize:
- business rules
- validation
- services
- scoring
- ranking
- lock logic
- provider sync

Avoid brittle UI tests.
Run pnpm test before finishing.
```

### 7. prediction-recovery-operator

Use for production prediction repair, manual reconstruction, import/export,
partial-row incidents, or any change that writes user predictions after a data
loss event.

Trigger examples:

```txt
Use $prediction-recovery-operator. Rebuild group_predictions from this reviewed CSV.
```

```txt
Use $prediction-recovery-operator. Audit which prediction rows are incomplete.
```

### 8. sync-incident-responder

Use when GitHub Actions sync fails, Vercel blocks a deployment, `/api/sync`
returns errors, or a provider/sync change might affect production data.

Trigger examples:

```txt
Use $sync-incident-responder. Triage the failed Sync World Cup Data workflow.
```

```txt
Use $sync-incident-responder. Deploy a blocked sync fix safely.
```

### 9. production-audit-runbook

Use for full app audits across frontend, Supabase, scoring, sync, operations,
tests, and deployment readiness.

Trigger examples:

```txt
Use $production-audit-runbook. Audit production readiness after the incident.
```

```txt
Use $production-audit-runbook. Produce a prioritized risk register for app_mundial.
```

### 10. vercel-deploy-recovery-operator

Use when Vercel production deploys are blocked, stale, disconnected from Git,
or need to be restored through GitHub Actions instead of native Vercel Git
integration.

Trigger examples:

```txt
Use $vercel-deploy-recovery-operator. Recover production deploys after Vercel blocks Git pushes.
```

```txt
Use $vercel-deploy-recovery-operator. Verify the GitHub Actions release path and current production alias.
```

## Skill maintenance rules

Update a skill only when:

- the same instruction has been repeated at least 2–3 times;
- Codex repeatedly makes the same mistake;
- the architecture changes;
- the acceptance criteria change;
- a new critical workflow appears.

Do not create new skills for one-off tasks.

## Current recommended active skill set

Core skills:

- project-phase-guardian
- supabase-rls-reviewer
- scoring-engine-validator
- mobile-sports-ui-reviewer
- provider-sync-guard
- prediction-recovery-operator
- sync-incident-responder
- production-audit-runbook
- vercel-deploy-recovery-operator

Optional after MVP grows:

- acceptance-test-writer
