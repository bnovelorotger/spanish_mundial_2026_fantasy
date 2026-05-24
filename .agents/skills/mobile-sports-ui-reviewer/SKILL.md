---
name: mobile-sports-ui-reviewer
description: Use this skill when designing or reviewing UI components, layouts, pages, Tailwind tokens, shadcn/ui usage, mobile responsiveness, or visual states for the World Cup Pick'em app.
---

# Mobile Sports UI Reviewer

## Purpose

Ensure the app follows the approved visual direction: mobile-first, dark premium sports broadcast, private tournament energy, rankings as trophy boards, predictions as playable cards, and matches as live sports events.

## When to use this skill

Use when working on:

- Dashboard UI
- Bottom navigation
- Ranking UI
- Match cards
- Calendar page
- Prediction cards
- Group prediction editor
- Bracket UI
- Profile UI
- Empty/loading/error states
- Tailwind theme tokens
- shadcn/ui component styling

## Source of truth

The full visual identity is defined in [`/docs/BRANDBOOK.md`](../../../docs/BRANDBOOK.md)
under codename **Private Tournament Mode**. This skill enforces it.

Read BRANDBOOK.md before any review or implementation. The tokens, components,
states, motion and copy rules below are summaries — the brandbook wins on any
discrepancy.

## Core visual concept

The app should feel like:

> A private World Cup tournament between friends, presented with premium sports broadcast energy, live ranking tension, and subtle sticker/card collectibility.

It must not feel like:

- a betting app;
- a casino product;
- a generic corporate dashboard;
- a FIFA clone;
- a fantasy football clone from the US market.

Internal identity:

> Private Tournament Mode

## Visual principles

- Mobile-first before desktop.
- Dark mode as the primary experience.
- Cards are the dominant visual unit.
- Rankings must feel important.
- Predictions must feel playable.
- Matches must feel like events.
- Use vivid colors as accents, not massive backgrounds.
- Every state must be visually obvious.
- The app should invite daily checking during the tournament.

## Color tokens

Use or preserve these tokens (full list and group colors in BRANDBOOK.md §4–§5 and §18):

```ts
background: {
  main: "#080D18",
  secondary: "#0D1321",
},
surface: {
  card: "#111827",
  elevated: "#182136",
  active: "#202B45",
},
border: {
  subtle: "#2A3654",
  strong: "#3A4A6A",
},
text: {
  primary: "#F8FAFC",
  secondary: "#CBD5E1",
  muted: "#94A3B8",
  disabled: "#64748B",
},
accent: {
  primary: "#00D4FF",
  secondary: "#8B5CF6",
},
status: {
  live: "#FF3B3B",
  success: "#2EE59D",
  warning: "#FFB020",
},
podium: {
  gold: "#FFD700",
  silver: "#C0C7D2",
  bronze: "#CD7F32",
}
```

## Typography

- General UI: Inter.
- Numbers, scores, rankings, countdowns, and points: Space Grotesk.
- Titles: semibold/bold.
- Metadata: small and muted.
- Scores and rankings: large and confident.

## UI component rules

### Cards

Cards should use:

- dark elevated surface;
- subtle border;
- 20–24px border radius;
- soft shadow;
- optional subtle glow only for important states.

Avoid flat gray boxes.

### Primary buttons

Use:

- cyan-to-violet gradient;
- pill radius;
- bold text;
- 48px mobile-friendly height;
- subtle glow.

Primary actions include:

- Save predictions
- Make picks
- Join league
- View ranking

### Badges

Must clearly communicate:

- Live
- Scheduled
- Finished
- Locked
- Editable
- Saved
- Correct
- Wrong
- Points

Live badge should feel alive with subtle pulse.

### Ranking

Ranking is a hero feature.

Must include:

- podium treatment for top 3;
- gold/silver/bronze accents;
- strong points display;
- user's own row highlighted;
- clear position;
- compact mobile layout.

### Match cards

Must show when available:

- phase;
- group;
- status;
- date/time;
- city/stadium;
- teams;
- flags/crests/placeholders;
- score;
- prediction;
- points.

### Group prediction cards

Must include:

- Group header;
- editable/locked badge;
- 4 team rows;
- position numbers;
- reorder controls;
- save action;
- deadline/lock info;
- group accent color as border/top line/glow, not full background.

### Bracket

Mobile-first:

- use tabs by round or horizontal scroll;
- avoid huge unreadable full bracket image;
- final card can receive special visual treatment.

## State rules

### Empty state

Avoid cold text.

Prefer:

- "Your tournament starts here."
- "Make your first picks before the deadline."

### Loading state

Use dark skeletons, not generic spinners.

### Error state

Human tone:

- "Couldn't load matches."
- "Try again."

### Locked state

Use lock icon, amber badge, and clear reason.

### Live state

Use red badge, subtle pulse, visible score.

### Finished state

Show result, points, and feedback.

## Motion rules

Use motion only to clarify interaction:

- tap scale: 0.98;
- transitions: 150–250ms;
- state transitions: 300–450ms;
- ranking movement: 500–700ms;
- live pulse slow;
- saved check animation;
- points counter animation.

Avoid decorative or distracting animation.

## Accessibility and usability

- Maintain readable contrast.
- Buttons must be easy to tap on mobile.
- Do not rely on color alone for status.
- Use semantic text labels.
- Avoid tiny touch targets.
- Ensure bottom nav does not cover content.

## Review output format

When reviewing UI, return:

```md
## UI review

## What matches the brandbook

- ...

## Issues to fix

- ...

## Mobile usability concerns

- ...

## State clarity

- ...

## Recommended changes

- ...

## Approved

Yes/No
```

## Definition of done

UI is acceptable only if:

- It is mobile-first.
- It follows the dark premium sports broadcast style.
- It does not look like betting/casino/corporate dashboard.
- States are visually clear.
- The ranking/prediction/match components feel like core product moments.
