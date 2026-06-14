---
name: production-audit-runbook
description: Use this skill when performing a full production audit of the World Cup Pick'em app across frontend, Supabase data integrity, auth/RLS, scoring, sync, Vercel/GitHub operations, tests, and deployment readiness.
---

# Production Audit Runbook

## Purpose

Produce a practical audit of the app's operational readiness and known risks.

Use this together with domain skills:

- `mobile-sports-ui-reviewer` for UI/brandbook checks.
- `supabase-rls-reviewer` for database and RLS checks.
- `scoring-engine-validator` for scoring and ranking.
- `provider-sync-guard` for providers, sync, and cron.
- `prediction-recovery-operator` after data incidents.

## Audit Scope

Cover:

- frontend routes and protected layouts;
- mobile UI, empty/error/loading states, and onboarding;
- auth and server actions;
- Supabase schema, constraints, and RLS;
- prediction integrity;
- scoring and ranking idempotency;
- provider normalization and sync;
- GitHub Actions and Vercel deployment;
- test coverage and build status;
- secrets and environment variables;
- operational backups and incident response.

## Required Evidence

Use concrete evidence:

- file paths and line references where useful;
- command outputs summarized in the final report;
- Supabase row counts and latest `sync_runs`;
- Git commit/deployment IDs for production concerns;
- exact command names for verification.

## Severity

Classify findings as:

- `P0`: production data loss, auth/security break, scoring corruption, app-down.
- `P1`: strong user impact, high support risk, incomplete recovery, missing guardrail.
- `P2`: polish, documentation, maintainability, non-blocking UX issue.

Classify effort as:

- `S`: small/localized.
- `M`: moderate multi-file change.
- `L`: larger design or migration.

## Standard Sections

Use this structure:

1. Executive summary.
2. Current production health.
3. Data integrity and predictions.
4. Scoring and ranking.
5. Sync/providers/cron.
6. Auth/RLS/security.
7. Frontend/UX/mobile.
8. Tests/build/deploy.
9. Backups and incident readiness.
10. Prioritized action table.

## Do Not

- Do not mutate production data during an audit unless explicitly requested.
- Do not run destructive commands.
- Do not expose secrets.
- Do not mark a risk closed without verification.

## Output

Write a concise Markdown report under `docs/` with:

- date in filename;
- findings with IDs;
- priority and effort;
- evidence;
- concrete recommendation;
- owner/action if obvious;
- final action table.
