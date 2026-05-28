import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RankingTable } from "@/components/worldcup/RankingTable";
import type { RankingEntry } from "@/lib/types/worldcup";

const rankingEntries: RankingEntry[] = [
  {
    avatarSource: null,
    avatarUrl: null,
    championPoints: 0,
    createdAt: "2026-06-01T00:00:00Z",
    displayName: "Ana",
    gapToLeader: 0,
    gapToPrevious: null,
    groupPoints: 9,
    knockoutPoints: 0,
    position: 1,
    totalPoints: 9,
    userId: "user-1",
    username: "ana",
  },
  {
    avatarSource: null,
    avatarUrl: null,
    championPoints: 0,
    createdAt: "2026-06-02T00:00:00Z",
    displayName: "Bruno",
    gapToLeader: 3,
    gapToPrevious: 3,
    groupPoints: 6,
    knockoutPoints: 0,
    position: 2,
    totalPoints: 6,
    userId: "user-2",
    username: "bruno",
  },
  {
    avatarSource: null,
    avatarUrl: null,
    championPoints: 0,
    createdAt: "2026-06-03T00:00:00Z",
    displayName: "Carla",
    gapToLeader: 4,
    gapToPrevious: 1,
    groupPoints: 5,
    knockoutPoints: 0,
    position: 3,
    totalPoints: 5,
    userId: "user-3",
    username: "carla",
  },
  {
    avatarSource: null,
    avatarUrl: null,
    championPoints: 0,
    createdAt: "2026-06-04T00:00:00Z",
    displayName: "Diego",
    gapToLeader: 6,
    gapToPrevious: 2,
    groupPoints: 3,
    knockoutPoints: 0,
    position: 4,
    totalPoints: 3,
    userId: "user-4",
    username: "diego",
  },
];

describe("RankingTable", () => {
  it("renders an ordered list with one list item per ranking entry", () => {
    const markup = renderToStaticMarkup(
      <RankingTable currentUserId="user-4" entries={rankingEntries} />,
    );

    expect(markup).toContain("<ol");
    expect(markup.match(/<li\b/g) ?? []).toHaveLength(rankingEntries.length);
  });

  it("announces the current user's row in the accessible label", () => {
    const markup = renderToStaticMarkup(
      <RankingTable currentUserId="user-4" entries={rankingEntries} />,
    );

    expect(markup).toContain("Tú.");
  });

  it("announces the three podium positions explicitly", () => {
    const markup = renderToStaticMarkup(
      <RankingTable currentUserId="user-4" entries={rankingEntries} />,
    );

    expect(markup).toContain("Primer lugar.");
    expect(markup).toContain("Segundo lugar.");
    expect(markup).toContain("Tercer lugar.");
  });
});
