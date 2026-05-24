# components/worldcup

Domain-specific React components for the World Cup Pick'em experience.

Expected files (created in later phases):

- `MatchCard.tsx` — Single match card (Phase 5).
- `TeamBadge.tsx` — Team flag + name pill (Phase 5).
- `GroupTable.tsx` — Read-only group standings table (Phase 6).
- `GroupPredictionEditor.tsx` — Reorderable group prediction UI (Phase 6).
- `RankingTable.tsx` — Full ranking with rows (Phase 7).
- `RankingCard.tsx` — Compact ranking widget (Phase 4 placeholder, Phase 7 data).
- `CountdownCard.tsx` — Countdown to next match (Phase 4).
- `PhaseBadge.tsx` — Phase label pill (Phase 4).
- `BracketView.tsx` — Knockout bracket view (Phase 9).
- `BracketPredictionEditor.tsx` — Knockout predictions UI (Phase 9).

Rules:

- These components consume view models, not raw DB rows.
- Business logic lives in `/lib/services`, not here.
- Mobile-first, dark UI.
- Every component here must follow [docs/BRANDBOOK.md](../../docs/BRANDBOOK.md):
  - `MatchCard` → §11.3
  - `TeamBadge` → §10 / §6
  - `GroupPredictionEditor` → §11.5
  - `RankingTable` / `RankingCard` → §11.7
  - `CountdownCard` → §11.2
  - `PhaseBadge` → §10
  - `BracketView` / `BracketPredictionEditor` → §11.6
