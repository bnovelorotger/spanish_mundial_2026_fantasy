import { describe, expect, it } from "vitest";

import {
  buildRankingEntries,
  getRankingByPhase,
  getRankingStamps,
  getTopRanking,
  getUserGapCopy,
  getUserRankingPosition,
  resolveRankingLiveState,
} from "@/lib/services/ranking.service";

function createRankingSupabaseMock(
  standings: Array<{ is_final: boolean }> = [],
) {
  const profiles = [
    {
      avatar_team: null,
      avatar_team_code: null,
      avatar_url:
        "https://dzvwgffjheyknrilwrvh.supabase.co/storage/v1/object/public/avatars/user-1/avatar.webp",
      created_at: "2026-06-01T00:00:00Z",
      display_name: "Ana",
      id: "user-1",
      username: "ana",
    },
    {
      avatar_team: {
        flag_url: "https://crests.football-data.org/760.svg",
      },
      avatar_team_code: "ESP",
      avatar_url: null,
      created_at: "2026-06-02T00:00:00Z",
      display_name: "Bruno",
      id: "user-2",
      username: "bruno",
    },
    {
      avatar_team: null,
      avatar_team_code: null,
      avatar_url: null,
      created_at: "2026-06-03T00:00:00Z",
      display_name: "Carla",
      id: "user-3",
      username: "carla",
    },
  ];

  const points = [
    {
      created_at: "2026-06-12T00:00:00Z",
      metadata: null,
      points_awarded: 9,
      reason: "Exact position",
      source_id: "group_b_team_1",
      source_type: "GROUP_POSITION" as const,
      user_id: "user-1",
    },
    {
      created_at: "2026-06-12T00:00:00Z",
      metadata: null,
      points_awarded: 6,
      reason: "Exact position",
      source_id: "group_a_team_1",
      source_type: "GROUP_POSITION" as const,
      user_id: "user-2",
    },
  ];

  return {
    from(table: string) {
      if (table === "profiles") {
        return {
          select() {
            return {
              order() {
                return Promise.resolve({
                  data: profiles,
                  error: null,
                });
              },
            };
          },
        };
      }

      if (table === "points") {
        return {
          select() {
            return Promise.resolve({
              data: points,
              error: null,
            });
          },
        };
      }

      if (table === "group_standings") {
        return {
          select() {
            return Promise.resolve({
              data: standings,
              error: null,
            });
          },
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  };
}

describe("buildRankingEntries", () => {
  it("sorts ranking by total points descending", () => {
    const ranking = buildRankingEntries(
      [
        {
          avatar_team: null,
          avatar_team_code: null,
          avatar_url: null,
          created_at: "2026-06-01T00:00:00Z",
          display_name: "Ana",
          id: "user-1",
          username: "ana",
        },
        {
          avatar_team: null,
          avatar_team_code: null,
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
          avatar_team: null,
          avatar_team_code: null,
          avatar_url: null,
          created_at: "2026-06-01T00:00:00Z",
          display_name: "Ana",
          id: "user-1",
          username: "ana",
        },
        {
          avatar_team: null,
          avatar_team_code: null,
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
          avatar_team: null,
          avatar_team_code: null,
          avatar_url: null,
          created_at: "2026-06-01T00:00:00Z",
          display_name: "Ana",
          id: "user-1",
          username: "ana",
        },
        {
          avatar_team: null,
          avatar_team_code: null,
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

describe("avatar resolution", () => {
  it("getTopRanking resolves uploaded photos, team crests, and empty avatars", async () => {
    const ranking = await getTopRanking(createRankingSupabaseMock() as never, 10);

    expect(ranking.map((entry) => ({
      avatarSource: entry.avatarSource,
      avatarUrl: entry.avatarUrl,
      userId: entry.userId,
    }))).toEqual([
      {
        avatarSource: "photo",
        avatarUrl:
          "https://dzvwgffjheyknrilwrvh.supabase.co/storage/v1/object/public/avatars/user-1/avatar.webp",
        userId: "user-1",
      },
      {
        avatarSource: "team",
        avatarUrl: "https://crests.football-data.org/760.svg",
        userId: "user-2",
      },
      {
        avatarSource: null,
        avatarUrl: null,
        userId: "user-3",
      },
    ]);
  });

  it("getUserRankingPosition returns the resolved avatar fields", async () => {
    const entry = await getUserRankingPosition(
      createRankingSupabaseMock() as never,
      "user-2",
    );

    expect(entry).toMatchObject({
      avatarSource: "team",
      avatarUrl: "https://crests.football-data.org/760.svg",
      userId: "user-2",
    });
  });
});

describe("ranking live state", () => {
  it("marks ranking live when any standing is not final", () => {
    expect(resolveRankingLiveState([
      { is_final: true },
      { is_final: false },
    ])).toBe(true);
  });

  it("marks ranking consolidated when all standings are final", () => {
    expect(resolveRankingLiveState([
      { is_final: true },
      { is_final: true },
    ])).toBe(false);
  });

  it("marks ranking consolidated before standings exist", () => {
    expect(resolveRankingLiveState([])).toBe(false);
  });

  it("exposes the live flag on the ranking model", async () => {
    const ranking = await getRankingByPhase(
      createRankingSupabaseMock([{ is_final: false }]) as never,
    );

    expect(ranking.isLive).toBe(true);
    expect(ranking.entries.map((entry) => entry.userId)).toEqual([
      "user-1",
      "user-2",
      "user-3",
    ]);
  });
});

describe("getUserGapCopy", () => {
  const ranking = buildRankingEntries(
    [
      {
        avatar_team: null,
        avatar_team_code: null,
        avatar_url: null,
        created_at: "2026-06-01T00:00:00Z",
        display_name: "Ana",
        id: "user-1",
        username: "ana",
      },
      {
        avatar_team: null,
        avatar_team_code: null,
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

  it("adds a recovered stamp for non user-submitted point metadata", () => {
    const stamps = getRankingStamps(
      {
        champion: 0,
        details: [
          {
            metadata: {
              predictionProvenance: "BASELINE",
              stamp: "Exact",
            },
            pointsAwarded: 3,
            reason: "Exact position",
            sourceId: "group_A_team_1",
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
      { label: "Recuperado", tone: "recovered" },
    ]);
  });

  it("supports knockout and champion point stamps from the new scale", () => {
    const stamps = getRankingStamps(
      {
        champion: 25,
        details: [
          {
            metadata: { stamp: "+25 pts" },
            pointsAwarded: 25,
            reason: "Champion bonus",
            sourceId: "champion_final_match-final",
            sourceType: "CHAMPION",
          },
        ],
        groupStage: 0,
        knockout: 0,
        total: 25,
      },
      2,
    );

    expect(stamps).toEqual([{ label: "+25 pts", tone: "points" }]);
  });
});
