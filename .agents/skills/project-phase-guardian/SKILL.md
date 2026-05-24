---
name: project-phase-guardian
description: Use this skill whenever implementing, reviewing, or continuing a specific project phase. It prevents scope creep, enforces phase boundaries, checks documentation, and requires lint/test/build verification before completion.
---

# Project Phase Guardian

## Purpose

You are working on a production-oriented MVP for a mobile-first World Cup 2026 Pick'em app.

This skill ensures that Codex only implements the requested phase, follows the project documentation, does not introduce future features early, and verifies the task before reporting completion.

## When to use this skill

Use this skill when the user says or implies:

- "Continue with Phase X"
- "Implement Phase X"
- "Do only this phase"
- "Work on the next phase"
- "Review this phase"
- "Check if Phase X is complete"
- "Do not move to another phase"

## Required project docs to read first

Before changing code, read:

- `/docs/IMPLEMENTATION_PLAN.md`
- `/docs/CODEX_RULES.md`
- `/docs/ACCEPTANCE_CRITERIA.md`
- `/docs/BRANDBOOK.md` when the phase touches UI (1, 4, 5, 6, 7, 9, 10)
- Any phase-specific docs mentioned by the user
- Existing relevant source files before editing them

If these files are missing, report that clearly and create only the missing documentation if the user asked for project setup. Do not invent hidden requirements.

## Absolute rules

- Work only on the requested phase.
- Do not implement future phases.
- Do not add unnecessary dependencies.
- Do not use Pages Router.
- Do not expose secrets.
- Do not call external football APIs from client components.
- Do not use `SUPABASE_SERVICE_ROLE_KEY` outside server-only code.
- Do not leave required MVP functionality as TODO.
- Do not fake success states.
- Do not remove working code unless necessary and explain why.
- Do not move to the next phase if verification fails.

## Workflow

1. Identify the requested phase.
2. Read the required docs.
3. Summarize the phase scope internally.
4. Inspect the current repo state.
5. Implement the smallest correct solution for that phase.
6. Keep UI, services, database, and tests separated.
7. Run verification commands.
8. Fix failures before completion.
9. Return a structured completion report.

## Verification commands

Run these when available:

```bash
pnpm lint
pnpm test
pnpm build
```

If a command does not exist yet, report it as unavailable and explain why.

If a command fails, fix the issue before reporting completion. If it cannot be fixed within the task, report the exact failing command, the error summary, and the remaining work.

## Output format

At the end, return:

```md
## Phase completed

Phase: [number/name]

## Files changed

- path/to/file
- path/to/file

## What was implemented

- ...

## Verification

- `pnpm lint`: pass/fail/not available
- `pnpm test`: pass/fail/not available
- `pnpm build`: pass/fail/not available

## Acceptance criteria

- [x] ...
- [x] ...

## Known limitations

- ...
```

## Definition of done

The phase is done only when:

- The requested phase scope is implemented.
- No future-phase functionality was added.
- Build/lint/test pass or failures are clearly documented.
- Acceptance criteria are explicitly checked.
- Security rules were respected.
