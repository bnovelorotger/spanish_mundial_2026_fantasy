---
name: supabase-rls-reviewer
description: Use this skill when creating or reviewing Supabase schema, migrations, RLS policies, auth clients, server actions, sync endpoints, or any code touching database security.
---

# Supabase RLS Reviewer

## Purpose

Review and enforce Supabase database security, RLS policies, schema consistency, idempotency, and secret handling for the World Cup 2026 Pick'em app.

## When to use this skill

Use when working on:

- Supabase migrations
- RLS policies
- Auth
- Server Actions that write data
- Admin/service role client
- Predictions persistence
- Points/scoring persistence
- Sync endpoints
- Seed files
- Database indexes and constraints

## Required docs to read first

- `/docs/DATABASE_SCHEMA.md`
- `/docs/TECHNICAL_ARCHITECTURE.md`
- `/docs/CODEX_RULES.md`
- `/docs/SCORING_RULES.md` when points or standings are involved

## Security principles

- RLS must be enabled on user-owned and sensitive tables.
- Public game data can be readable by authenticated users.
- Users can only write their own profile and predictions.
- Clients cannot write matches, standings, sync runs, or points.
- Service role can only be used in server-only code.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser.
- Never import admin clients into Client Components.
- Never rely only on frontend validation.
- Server-side validation is required for all mutations.

## Required table expectations

The MVP schema must support:

- `profiles`
- `teams`
- `matches`
- `group_standings`
- `group_predictions`
- `knockout_predictions`
- `champion_predictions`
- `points`
- `app_settings`
- `game_locks`
- `sync_runs`

## RLS review checklist

Check that:

- RLS is enabled on appropriate tables.
- `profiles`:
  - authenticated users can read profiles needed for ranking;
  - users can update only their own profile.
- `teams`:
  - authenticated users can read;
  - clients cannot write.
- `matches`:
  - authenticated users can read;
  - clients cannot write.
- `group_standings`:
  - authenticated users can read;
  - clients cannot write.
- `group_predictions`:
  - users can read/write only their own predictions;
  - locked phases are protected at service level.
- `points`:
  - authenticated users can read ranking-relevant rows;
  - clients cannot write points.
- `sync_runs`:
  - not writable by clients.
- `game_locks`:
  - readable if needed;
  - not writable by clients.

## Constraint checklist

Ensure:

- UUID primary keys where appropriate.
- `gen_random_uuid()` defaults where appropriate.
- `timestamptz` for timestamps.
- Foreign keys are explicit.
- Useful indexes exist for:
  - `user_id`
  - `group_letter`
  - `kickoff`
  - `phase`
  - `status`
  - ranking/points lookups
- Idempotency constraints exist for points:
  - unique combination of `user_id`, `source_type`, `source_id`
- Prediction uniqueness prevents duplicate rows per user/team/group/position where appropriate.

## Supabase client rules

Expected files:

- `/lib/supabase/client.ts`
- `/lib/supabase/server.ts`
- `/lib/supabase/admin.ts`

Rules:

- Browser client can only use public anon key.
- Server client uses cookies/session.
- Admin client is server-only.
- Admin client must guard against accidental client import.
- Environment variables must be documented in `.env.example`.

## Server Action rules

For every write mutation:

- Require authenticated user.
- Validate input server-side.
- Check ownership.
- Check lock state when relevant.
- Return safe errors.
- Do not leak internal errors to the UI.

## Output format

When reviewing, return:

```md
## Supabase/RLS review

## Critical issues

- ...

## Security risks

- ...

## Missing constraints or indexes

- ...

## RLS policy findings

- ...

## Required fixes

- ...

## Approved

Yes/No
```

## Definition of done

A database/auth change is acceptable only if:

- RLS and ownership are correct.
- Secrets are server-only.
- Writes are validated server-side.
- Idempotency is enforced in the database where required.
- No client can mutate protected system data.
