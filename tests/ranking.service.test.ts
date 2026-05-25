import { describe, expect, it } from "vitest";

import {
  buildRankingEntries,
  getRankingStamps,
  getUserGapCopy,
} from "@/lib/services/ranking.service";

describe("buildRankingEntries", () => {
  it("sorts ranking by total points descending", () => {
    const ranking = buildRankingEntries(
      [
        {
          avatar_url: null,
          created_at: "2026-06-01T00:00:00Z",
          display_name: "Ana",
          id: "user-1",
          username: "ana",
        },
        {
          avatar_url: null,
          created_at: "2026-06-02T00:00:00Z",
          display_name: "Bruno",
          id: "user-2",
          username: "bruno",
        },
      ],
      [
        {
          created_at: "2026-06-12T00:00:00Z",
          metadata: null,
          points_awarded: 6,
          reason: "Exact position",
          source_id: "group_a_team_1",
          source_type: "GROUP_POSITION",
          user_id: "user-2",
        },
        {
          created_at: "2026-06-12T00:00:00Z",
          metadata: null,
          points_awarded: 9,
          reason: "Exact position",
          source_id: "group_b_team_1",
          source_type: "GROUP_POSITION",
          user_id: "user-1",
        },
      ],
    );

    expect(ranking.map((entry) => entry.userId)).toEqual(["user-1", "user-2"]);
  });

  it("uses knockout points as the second tie-break", () => {
    const ranking = buildRankingEntries(
      [
        {
          avatar_url: null,
          created_at: "2026-06-01T00:00:00Z",
          display_name: "Ana",
          id: "user-1",
          username: "ana",
        },
        {
          avatar_url: null,
          created_at: "2026-06-02T00:00:00Z",
          display_name: "Bruno",
          id: "user-2",
          username: "bruno",
        },
      ],
      [
        {
          created_at: "2026-06-12T00:00:00Z",
          metadata: null,
          points_awarded: 4,
          reason: "Group",
          source_id: "group_a_team_1",
          source_type: "GROUP_POSITION",
          user_id: "user-1",
        },
        {
          created_at: "2026-06-12T00:00:00Z",
          metadata: null,
          points_awarded: 4,
          reason: "Group",
          source_id: "group_b_team_1",
          source_type: "GROUP_POSITION",
          user_id: "user-2",
        },
        {
          created_at: "2026-06-13T00:00:00Z",
          metadata: null,
          points_awarded: 3,
          reason: "Knockout",
          source_id: "match_1",
          source_type: "KNOCKOUT_WINNER",
          user_id: "user-1",
        },
      ],
    );

    expect(ranking[0]?.userId).toBe("user-1");
    expect(ranking[0]?.knockoutPoints).toBe(3);
  });

  it("uses the older profile creation date as the final tie-break", () => {
    const ranking = buildRankingEntries(
      [
        {
          avatar_url: null,
          created_at: "2026-06-01T00:00:00Z",
          display_name: "Ana",
          id: "user-1",
          username: "ana",
        },
        {
          avatar_url: null,
          created_at: "2026-06-05T00:00:00Z",
          display_name: "Bruno",
          id: "user-2",
          username: "bruno",
        },
      ],
      [
        {
          created_at: "2026-06-12T00:00:00Z",
          metadata: null,
          points_awarded: 6,
          reason: "Group",
          source_id: "group_a_team_1",
          source_type: "GROUP_POSITION",
          user_id: "user-1",
        },
        {
          created_at: "2026-06-12T00:00:00Z",
          metadata: null,
          points_awarded: 6,
          reason: "Group",
          source_id: "group_b_team_1",
          source_type: "GROUP_POSITION",
          user_id: "user-2",
        },
      ],
    );

    expect(ranking[0]?.userId).toBe("user-1");
    expect(ranking[1]?.gapToLeader).toBe(0);
  });
});

describe("getUserGapCopy", () => {
  const ranking = buildRankingEntries(
    [
      {
        avatar_url: null,
        created_at: "2026-06-01T00:00:00Z",
        display_name: "Ana",
        id: "user-1",
        username: "ana",
      },
      {
        avatar_url: null,
        created_at: "2026-06-02T00:00:00Z",
        display_name: "Bruno",
        id: "user-2",
        username: "bruno",
      },
    ],
    [
      {
        created_at: "2026-06-12T00:00:00Z",
        metadata: null,
        points_awarded: 9,
        reason: "Group",
        source_id: "group_a_team_1",
        source_type: "GROUP_POSITION",
        user_id: "user-1",
      },
      {
        created_at: "2026-06-12T00:00:00Z",
        metadata: null,
        points_awarded: 5,
        reason: "Group",
        source_id: "group_b_team_1",
        source_type: "GROUP_POSITION",
        user_id: "user-2",
      },
    ],
  );

  it("celebrates the league leader", () => {
    expect(getUserGapCopy(ranking, "user-1")).toBe(
      "Marcas el ritmo de toda la liga.",
    );
  });

  it("shows the exact point gap behind the leader", () => {
    expect(getUserGapCopy(ranking, "user-2")).toBe(
      "Estás a 4 pts de Ana.",
    );
  });
});

describe("getRankingStamps", () => {
  it("builds exact and miss stamps from the points breakdown metadata", () => {
    const stamps = getRankingStamps(
      {
        champion: 0,
        details: [
          {
            metadata: { stamp: "Exact" },
            pointsAwarded: 3,
            reason: "Exact position",
            sourceId: "group_A_team_1",
            sourceType: "GROUP_POSITION",
          },
          {
            metadata: { stamp: "Miss" },
            pointsAwarded: 0,
            reason: "Miss",
            sourceId: "group_A_team_2",
            sourceType: "GROUP_POSITION",
          },
        ],
        groupStage: 3,
        knockout: 0,
        total: 3,
      },
      4,
    );

    expect(stamps).toEqual([
      { label: "Exacto", tone: "exact" },
      { label: "+3 pts", tone: "points" },
      { label: "Fallo", tone: "miss" },
    ]);
  });
});
