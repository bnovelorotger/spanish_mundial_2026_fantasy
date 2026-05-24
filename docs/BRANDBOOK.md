# Brandbook & Visual Direction — World Cup 2026 Pick'em

This document is the **source of truth for design and visual implementation**.
Every UI-touching phase in [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md)
(Phases 1, 4, 5, 6, 7, 9, 10) must follow this brandbook. Codex must read it
before writing any component or style.

Internal codename for this visual identity: **Private Tournament Mode**.

---

## 1. Core concept

The app must feel like:

> A **private World Cup competition between friends**, presented with the
> aesthetics of a premium broadcast, a live ranking, and the energy of a
> nighttime stadium.

It is **not**:

- a betting app,
- a corporate dashboard,
- a FIFA clone,
- a US-style fantasy sports app.

It **is**: premium sports broadcast + private tournament + sticker/card energy.

---

## 2. Personality

Words the app must transmit: **competition, hype, friendship, World Cup,
night, scoreboard, ranking, urgency, collectibility, sports control room.**

Guiding line:

> "This feels like a premium World Cup broadcast, but built for me to compete
> with my friends."

---

## 3. Look & feel

**Dark-first, mobile-first, high-energy, premium, tactile.**

The app must be designed to be opened many times a day during the tournament.

Key sensations:

- dark backgrounds;
- elevated cards;
- subtle glows;
- vivid colors used as **accents**, never as flat fills;
- large numbers;
- ranking as a hero element;
- matches presented as premium cards;
- predictions presented as playable pieces;
- crystal-clear states: `editable`, `locked`, `live`, `finished`, `correct`,
  `wrong`.

---

## 4. Official palette

### Base surfaces

```css
--background-main: #080D18;
--background-secondary: #0D1321;
--surface-card: #111827;
--surface-card-elevated: #182136;
--surface-card-active: #202B45;
--border-subtle: #2A3654;
--border-strong: #3A4A6A;
```

### Text

```css
--text-primary: #F8FAFC;
--text-secondary: #CBD5E1;
--text-muted: #94A3B8;
--text-disabled: #64748B;
```

### Primary accent — cyan

```css
--accent-primary: #00D4FF;
--accent-primary-soft: rgba(0, 212, 255, 0.14);
--accent-primary-border: rgba(0, 212, 255, 0.35);
```

Use for: primary CTAs, active elements, important deadlines, featured match,
user's own ranking row.

### Secondary accent — violet

```css
--accent-secondary: #8B5CF6;
--accent-secondary-soft: rgba(139, 92, 246, 0.16);
```

Use for: predictions, bracket, editable states, interactive elements.

### Live / danger — red

```css
--live-red: #FF3B3B;
--live-red-soft: rgba(255, 59, 59, 0.16);
```

Use for: live matches, very close deadlines, critical alerts.

### Success — green

```css
--success: #2EE59D;
--success-soft: rgba(46, 229, 157, 0.16);
```

Use for: correct prediction, saved state, finished positive, points earned.

### Warning / locked — amber

```css
--warning: #FFB020;
--warning-soft: rgba(255, 176, 32, 0.16);
```

Use for: locked predictions, approaching deadlines, pending state.

### Ranking podium

```css
--gold:   #FFD700;
--silver: #C0C7D2;
--bronze: #CD7F32;
```

Used **exclusively** for top-3 ranking treatment, podium and position badges.

---

## 5. Group colors

Used as **accents only** — borders, badges, lateral lines, soft glows. Never
as the dominant background of a card.

```css
--group-a: #00D4FF;
--group-b: #3B82F6;
--group-c: #8B5CF6;
--group-d: #EC4899;
--group-e: #FF8A00;
--group-f: #FF3B3B;
--group-g: #D9F99D;
--group-h: #2EE59D;
--group-i: #14B8A6;
--group-j: #6366F1;
--group-k: #F43F5E;
--group-l: #A3E635;
```

---

## 6. Typography

**UI body:** Inter
**Numbers, scores, countdowns, ranking points:** Space Grotesk

| Use | Family | Weight |
|---|---|---|
| Titles | Inter | Semibold / Bold |
| Body | Inter | Regular / Medium |
| Scores | Space Grotesk | Bold |
| Ranking points | Space Grotesk | Bold |
| Countdown | Space Grotesk | Bold |

### Mobile scale

```css
--text-xs:  12px;
--text-sm:  14px;
--text-base:16px;
--text-lg:  18px;
--text-xl:  20px;
--text-2xl: 24px;
--text-3xl: 32px;
```

| Element | Size |
|---|---|
| Home title | 24–32px |
| Card title | 16–18px |
| Body | 14–16px |
| Metadata | 12–13px |
| Scores | 24–36px |
| Ranking points | 20–28px |

---

## 7. Background

The main background is dark but **never flat black**. Use a subtle radial
gradient:

```css
background:
  radial-gradient(circle at top right,    rgba(0, 212, 255, 0.10), transparent 28%),
  radial-gradient(circle at bottom left,  rgba(139, 92, 246, 0.10), transparent 28%),
  #080D18;
```

---

## 8. Cards

Cards are the **dominant visual unit**.

Default card:

```css
background: #111827;
border: 1px solid #2A3654;
border-radius: 20px;
box-shadow: 0 12px 40px rgba(0, 0, 0, 0.28);
```

Important / featured card:

```css
background: linear-gradient(180deg, #182136 0%, #111827 100%);
border: 1px solid rgba(0, 212, 255, 0.24);
```

### Glow

Use glow **only** for: live matches, primary CTA, top-3 ranking, active
deadline.

```css
box-shadow: 0 0 32px rgba(0, 212, 255, 0.18);
```

---

## 9. Buttons

### Primary

For: save predictions, create league, join league, view ranking, make picks.

```css
background: linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%);
color: #FFFFFF;
border-radius: 999px;
height: 48px;
font-weight: 700;
box-shadow: 0 10px 28px rgba(0, 212, 255, 0.22);
```

Copy: clear, direct, competitive. Examples: "Save predictions",
"Make your picks", "Join league", "View ranking".

### Secondary

```css
background: rgba(255, 255, 255, 0.06);
border: 1px solid #2A3654;
color: #F8FAFC;
border-radius: 999px;
height: 44px;
```

### Ghost

```css
background: transparent;
color: #94A3B8;
```

### Danger / live

```css
background: rgba(255, 59, 59, 0.16);
border: 1px solid rgba(255, 59, 59, 0.35);
color: #FF3B3B;
```

---

## 10. Badges

Badges carry the sports feel. Pill shape (`border-radius: 999px`), small,
high-contrast text.

| State | Background | Color | Label |
|---|---|---|---|
| Live | `rgba(255,59,59,0.16)` + border `rgba(255,59,59,0.35)` | `#FF3B3B` | `LIVE` (soft pulse) |
| Scheduled | `rgba(0,212,255,0.14)` | `#00D4FF` | `Scheduled` |
| Finished | `rgba(46,229,157,0.16)` | `#2EE59D` | `Finished` |
| Locked | `rgba(255,176,32,0.16)` | `#FFB020` | `Locked` |
| Editable | `rgba(139,92,246,0.16)` | `#A78BFA` | `Editable` |

---

## 11. Components

### 11.1 Home Dashboard

Goal: in 5 seconds, the user must know:
what's pending, how they rank, when the deadline is, who's leading,
what the next match is.

Recommended order:

1. Header with league name.
2. Countdown card.
3. My ranking position.
4. Next match.
5. CTA for pending predictions.
6. Top ranking.
7. Activity feed.

### 11.2 Countdown Card

Emotional. Example copy: "Predictions close in".

Big numbers: `02d 14h 31m`.

- Card with cyan/violet glow.
- Clock icon.
- Amber when time is low.
- Red when less than 2 hours.

### 11.3 Match Card

Must show: phase, status, date/time, city/stadium, home team, away team,
crests/flags, real result, user prediction, points earned.

Two variants:

- **Compact** — used in lists.
- **Premium** — used in detail and prediction screens.

### 11.4 Prediction Card

Must feel like a card the user "plays".

States: `empty`, `editing`, `saved`, `locked`, `live`, `correct`, `wrong`,
`partial`.

- Saved → check icon + label `Saved`.
- Locked → padlock + deadline.
- Correct → stamp `+3 pts`.
- Wrong → discreet stamp `Miss`.

### 11.5 Group Prediction Card

Structure:

- Header: Group X + editable/locked badge.
- Draggable list of teams.
- Position number 1–4.
- Flag/crest + country name.
- Save button.
- Deadline state.

Visual:

- Top border in the group color.
- Teams as small card rows.
- Visible drag handle.
- Tactile feedback when reordering.

### 11.6 Bracket

Mobile-first — **never one giant image**.

Recommended:

- Tabs per round, or
- horizontal scroll with one round per column.
- Compact cards with subtle connecting lines.
- Highlight the user's predicted path.

Rounds: Round of 32 → Round of 16 → Quarter-finals → Semi-finals → Final.
The Final gets a special card treatment.

### 11.7 Ranking

The ranking is a **hero element**.

Must show: podium top 3, avatar, name, position, points, movement, badges,
**the user's own row always pinned visibly** — even if their position is far
down.

- Top 3 → larger cards, gold/silver/bronze glow, medal icon, point gap shown.
- Normal row → position, avatar, name, points, movement arrow.
- User row → cyan border, active background, `You` label.

Engagement copy example: "You're 4 pts behind Carlos."

---

## 12. Visual states

| State | Treatment |
|---|---|
| Empty | Human copy. "Your tournament starts here." + clear CTA. **Never** "No data." |
| Loading | Dark skeletons. **No generic spinners.** |
| Error | Human tone. "Couldn't load matches. Try again." |
| Locked | Padlock + amber badge. Clear, not aggressive. |
| Live | Red pulsing badge, prominent score, soft red glow on the card. |
| Finished | Result + points + feedback stamp (`+3 pts`, `Correct winner`, `Exact score`). |

---

## 13. Motion

Subtle, not decorative. Use Framer Motion.

Durations:

- 150–250ms — taps and micro-interactions.
- 300–450ms — state changes.
- 500–700ms — ranking movement.

Easing: spring or ease-out. Never harsh.

Key animations:

- Card tap → `scale(0.98)`.
- Desktop hover → subtle glow.
- Saving prediction → check animation.
- Live badge → slow pulse.
- Ranking row → animate up/down on change.
- Points earned → counter ticks up.
- Deadline → progressive color transition cyan → amber → red.

---

## 14. Iconography

**Library:** Lucide React.
**Style:** stroke icons, 2px, rounded, minimalist. **No cartoon icons.**

Primary icon set: Trophy, Clock, Lock, Check, X, Users, Calendar, Shield,
ChevronRight, Flame, Medal, ArrowUp, ArrowDown, Target, Crown.

---

## 15. Mobile layout

### Padding

- Screen edges: 16px.
- Card interior: 16–20px.
- Between sections: 24–32px.

### Border radius

- Large cards: 20–24px.
- Small cards: 14–16px.
- Buttons: 999px (pill).
- Badges: 999px (pill).

### Bottom navigation

Items: Home · Predictions · Matches · Ranking · Profile.

```css
background: rgba(8, 13, 24, 0.86);
backdrop-filter: blur(16px);
border-top: 1px solid #2A3654;
```

Active item → cyan glow + highlighted icon.

---

## 16. Proprietary visual language

Three recurring graphic devices the app **must own**:

1. **Tournament Cards** — scoreboard / collectible-card aesthetic.
2. **Prediction Stamps** — `+3 pts`, `Exact`, `Winner`, `Miss`, `Locked`.
3. **Stadium Glow** — subtle stadium-lighting glows for important moments.

These are what make the app feel proprietary rather than templated.

---

## 17. Copy

Avoid betting language entirely.

**Don't use:** Bet, Odds, Stake, Cashout, Wager.

**Use:** Pick, Prediction, Points, League, Ranking, Friends, Tournament,
Locked, Live, Correct, Exact score.

Examples:

- "Make your picks"
- "Predictions close soon"
- "You're 4 pts behind the leader"
- "Group stage locked"
- "Exact score hit"
- "Your league is heating up"

---

## 18. Tailwind tokens

Codex must extend Tailwind theme with these tokens during Phase 1.

```ts
// tailwind.config.ts → theme.extend
colors: {
  background: {
    main:      "#080D18",
    secondary: "#0D1321",
  },
  surface: {
    card:     "#111827",
    elevated: "#182136",
    active:   "#202B45",
  },
  border: {
    subtle: "#2A3654",
    strong: "#3A4A6A",
  },
  text: {
    primary:   "#F8FAFC",
    secondary: "#CBD5E1",
    muted:     "#94A3B8",
    disabled:  "#64748B",
  },
  accent: {
    primary:   "#00D4FF",
    secondary: "#8B5CF6",
  },
  status: {
    live:    "#FF3B3B",
    success: "#2EE59D",
    warning: "#FFB020",
  },
  podium: {
    gold:   "#FFD700",
    silver: "#C0C7D2",
    bronze: "#CD7F32",
  },
  group: {
    a: "#00D4FF", b: "#3B82F6", c: "#8B5CF6", d: "#EC4899",
    e: "#FF8A00", f: "#FF3B3B", g: "#D9F99D", h: "#2EE59D",
    i: "#14B8A6", j: "#6366F1", k: "#F43F5E", l: "#A3E635",
  },
},
boxShadow: {
  card:        "0 12px 40px rgba(0,0,0,0.28)",
  glowCyan:    "0 0 32px rgba(0,212,255,0.18)",
  glowViolet:  "0 0 32px rgba(139,92,246,0.18)",
  glowRed:     "0 0 28px rgba(255,59,59,0.18)",
},
borderRadius: {
  card:   "20px",
  cardLg: "24px",
  pill:   "999px",
},
fontFamily: {
  sans:   ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
  numeric:["'Space Grotesk'", "ui-sans-serif", "sans-serif"],
},
```

> **Tailwind v4 note:** the project uses Tailwind v4. Tokens may equivalently
> be defined via `@theme` in `app/globals.css`. The token names, values, and
> semantics above are normative — the syntax can adapt to v4.

---

## 19. Direction for Codex — non-negotiable rules

1. Mobile-first before desktop.
2. Dark mode is the primary experience.
3. Cards are the dominant visual unit.
4. Ranking gets maximum visual prominence.
5. Nothing must look like a betting app.
6. Nothing must look like a corporate dashboard.
7. Vivid colors are accents, never massive fills.
8. Every state must be visually obvious.
9. Predictions must feel playable.
10. Matches must feel like live events.
11. The bracket must be usable on mobile.
12. The app must invite the user to come back every day.

---

## 20. Screen priority order

Order to design and ship:

1. Home Dashboard
2. Bottom Navigation
3. Ranking
4. Match Card
5. Group Prediction
6. Bracket Prediction
7. Match Detail
8. Create / Join League
9. Profile
10. Empty / Loading / Error states

---

## 21. Base prompt to feed Codex (visual)

Append this block to any UI-building phase prompt:

```text
Use the World Cup 2026 Pick'em brandbook as the source of truth for design.
File: /docs/BRANDBOOK.md.

Build mobile-first with a dark premium sports-broadcast aesthetic. The product
must feel like a private tournament between friends, combining global sports
broadcast visuals, digital tournament dashboards, and subtle sticker/card
energy.

Direction:
- Dark-first, premium, energetic, mobile-first.
- Not betting, not casino, not corporate dashboard, not FIFA clone.
- Cards are the main visual unit.
- Rankings feel like a trophy board.
- Predictions feel like playable cards.
- Matches feel like live sports events.
- Use subtle stadium glow, badges, stamps and tournament lines.

Colors: see Tailwind tokens in /docs/BRANDBOOK.md §18.
Typography: Inter for UI, Space Grotesk for numbers / scores / countdowns.
Motion: Framer Motion — tap scale 0.98, live pulse, ranking movement,
points counter, saved check.

Goal: when users open the app they should think
"This feels like the World Cup. I want to check the ranking every day."
```

---

## Summary

**Private Tournament Mode** is the visual identity. Every component, every
state, every copy choice must reinforce it: a private World Cup competition
between friends, with the visual language of a premium broadcast and the
texture of collectible cards.
