import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockGetBracketRounds,
  mockCreateAdminClient,
  mockGetGroupStageLock,
  mockGetPhaseLock,
  mockGetRankingByPhase,
  mockGetUserGapCopy,
  mockGetUserPointsBreakdown,
} = vi.hoisted(() => ({
  mockGetBracketRounds: vi.fn(),
  mockCreateAdminClient: vi.fn(),
  mockGetGroupStageLock: vi.fn(),
  mockGetPhaseLock: vi.fn(),
  mockGetRankingByPhase: vi.fn(),
  mockGetUserGapCopy: vi.fn(),
  mockGetUserPointsBreakdown: vi.fn(),
}));

vi.mock("@/lib/services/bracket.service", () => ({
  getBracketRounds: mockGetBracketRounds,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mockCreateAdminClient,
}));

vi.mock("@/lib/services/locks.service", () => ({
  getGroupStageLock: mockGetGroupStageLock,
  getPhaseLock: mockGetPhaseLock,
}));

vi.mock("@/lib/services/ranking.service", () => ({
  getRankingByPhase: mockGetRankingByPhase,
  getUserGapCopy: mockGetUserGapCopy,
  getUserPointsBreakdown: mockGetUserPointsBreakdown,
}));

import {
  getParticipantDetail,
  getParticipantExplorerEntries,
  getResultsFeed,
} from "@/lib/services/ranking-explorer.service";
import type { RankingEntry } from "@/lib/types/worldcup";

function createResultsFeedSupabaseMock() {
  const matches = [
    {
      away_score: 1,
      away_team: {
        code: "CAN",
        flag_url: "https://flagcdn.com/ca.svg",
        is_tbd: false,
        name: "Canada",
      },
      city: "Mexico City",
      group_letter: "A",
      home_score: 2,
      home_team: {
        code: "MEX",
        flag_url: "https://flagcdn.com/mx.svg",
        is_tbd: false,
        name: "Mexico",
      },
      id: "match-group-a",
      kickoff: "2026-06-20T19:00:00Z",
      phase: "GROUP_STAGE",
      status: "FINISHED",
      updated_at: "2026-06-20T21:00:00Z",
      venue: "Azteca",
      winner_side: "HOME",
    },
    {
      away_score: 1,
      away_team: {
        code: "USA",
        flag_url: "https://flagcdn.com/us.svg",
        is_tbd: false,
        name: "United States",
      },
      city: "Los Angeles",
      group_letter: null,
      home_score: 1,
      home_team: {
        code: "MEX",
        flag_url: "https://flagcdn.com/mx.svg",
        is_tbd: false,
        name: "Mexico",
      },
      id: "match-final",
      kickoff: "2026-07-19T19:00:00Z",
      phase: "FINAL",
      status: "FINISHED",
      updated_at: "2026-07-19T21:00:00Z",
      venue: "MetLife",
      winner_side: "AWAY",
    },
  ];

  const standings = [
    {
      goal_difference: 4,
      goals_for: 6,
      group_letter: "A",
      is_final: true,
      points: 7,
      position: 1,
      qualification_status: "QUALIFIED_FIRST",
      team_id: "team-mex",
      updated_at: "2026-06-20T22:00:00Z",
    },
    {
      goal_difference: 1,
      goals_for: 4,
      group_letter: "A",
      is_final: true,
      points: 5,
      position: 2,
      qualification_status: "QUALIFIED_SECOND",
      team_id: "team-rsa",
      updated_at: "2026-06-20T22:00:00Z",
    },
    {
      goal_difference: -2,
      goals_for: 2,
      group_letter: "A",
      is_final: true,
      points: 2,
      position: 3,
      qualification_status: "ELIMINATED",
      team_id: "team-can",
      updated_at: "2026-06-20T22:00:00Z",
    },
    {
      goal_difference: -3,
      goals_for: 1,
      group_letter: "A",
      is_final: true,
      points: 1,
      position: 4,
      qualification_status: "ELIMINATED",
      team_id: "team-jpn",
      updated_at: "2026-06-20T22:00:00Z",
    },
  ];

  const teams = [
    {
      code: "MEX",
      flag_url: "https://flagcdn.com/mx.svg",
      id: "team-mex",
      is_tbd: false,
      name: "Mexico",
    },
    {
      code: "RSA",
      flag_url: "https://flagcdn.com/za.svg",
      id: "team-rsa",
      is_tbd: false,
      name: "South Africa",
    },
    {
      code: "CAN",
      flag_url: "https://flagcdn.com/ca.svg",
      id: "team-can",
      is_tbd: false,
      name: "Canada",
    },
    {
      code: "JPN",
      flag_url: "https://flagcdn.com/jp.svg",
      id: "team-jpn",
      is_tbd: false,
      name: "Japan",
    },
  ];

  const points = [
    {
      metadata: {
        groupLetter: "A",
        teamId: "team-mex",
      },
      points_awarded: 3,
      source_id: "group_A_mx",
      source_type: "GROUP_POSITION",
      user_id: "user-1",
    },
    {
      metadata: {
        groupLetter: "A",
        teamId: "team-rsa",
      },
      points_awarded: 0,
      source_id: "group_A_rsa",
      source_type: "GROUP_POSITION",
      user_id: "user-1",
    },
    {
      metadata: {
        groupLetter: "A",
        teamId: "team-mex",
      },
      points_awarded: 0,
      source_id: "group_A_mx_u2",
      source_type: "GROUP_POSITION",
      user_id: "user-2",
    },
    {
      metadata: {
        matchId: "match-final",
        winnerSide: "AWAY",
      },
      points_awarded: 25,
      source_id: "knockout_final_user1",
      source_type: "KNOCKOUT_WINNER",
      user_id: "user-1",
    },
    {
      metadata: {
        matchId: "match-final",
        winnerSide: "AWAY",
      },
      points_awarded: 0,
      source_id: "knockout_final_user2",
      source_type: "KNOCKOUT_WINNER",
      user_id: "user-2",
    },
    {
      metadata: {
        matchId: "match-final",
        winnerSide: "AWAY",
      },
      points_awarded: 25,
      source_id: "champion_final_user1",
      source_type: "CHAMPION",
      user_id: "user-1",
    },
  ];

  return {
    from(table: string) {
      if (table === "matches") {
        return {
          select() {
            return {
              eq() {
                return {
                  in() {
                    return Promise.resolve({
                      data: matches,
                      error: null,
                    });
                  },
                };
              },
            };
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

      if (table === "teams") {
        return {
          select() {
            return {
              in() {
                return Promise.resolve({
                  data: teams,
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

      throw new Error(`Unexpected table ${table}`);
    },
  };
}

function createParticipantSupabaseMock() {
  const groupPredictions = [
    {
      group_letter: "A",
      predicted_position: 1,
      team_id: "team-mex",
    },
    {
      group_letter: "A",
      predicted_position: 2,
      team_id: "team-rsa",
    },
  ];

  const standings = [
    {
      goal_difference: 4,
      goals_for: 6,
      group_letter: "A",
      is_final: false,
      points: 6,
      position: 1,
      qualification_status: "QUALIFIED_FIRST",
      team_id: "team-mex",
      updated_at: "2026-06-20T22:00:00Z",
    },
    {
      goal_difference: 1,
      goals_for: 4,
      group_letter: "A",
      is_final: false,
      points: 4,
      position: 2,
      qualification_status: "QUALIFIED_SECOND",
      team_id: "team-rsa",
      updated_at: "2026-06-20T22:00:00Z",
    },
  ];

  const teams = [
    {
      code: "MEX",
      flag_url: "https://flagcdn.com/mx.svg",
      id: "team-mex",
      is_tbd: false,
      name: "Mexico",
    },
    {
      code: "RSA",
      flag_url: "https://flagcdn.com/za.svg",
      id: "team-rsa",
      is_tbd: false,
      name: "South Africa",
    },
  ];

  const points = [
    {
      metadata: {
        actualPosition: 1,
        groupLetter: "A",
        qualificationStatus: "QUALIFIED_FIRST",
        stamp: "+3 pts",
        teamId: "team-mex",
      },
      points_awarded: 3,
      source_id: "group_a_mx",
      source_type: "GROUP_POSITION",
      user_id: "user-2",
    },
  ];

  return {
    from(table: string) {
      if (table === "group_predictions") {
        return {
          select() {
            return {
              eq() {
                return Promise.resolve({
                  data: groupPredictions,
                  error: null,
                });
              },
            };
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

      if (table === "teams") {
        return {
          select() {
            return {
              in() {
                return Promise.resolve({
                  data: teams,
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
            return {
              eq() {
                return Promise.resolve({
                  data: points,
                  error: null,
                });
              },
            };
          },
        };
      }

      throw new Error(`Unexpected table ${table}`);
    },
  };
}

const rankingEntries: RankingEntry[] = [
  {
    avatarSource: "photo",
    avatarUrl: "https://avatars.example.com/user-1.webp",
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
    avatarSource: "team",
    avatarUrl: "https://crests.example.com/mex.svg",
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
];

describe("getResultsFeed", () => {
  it("builds a newest-first feed with group closures and final impact", async () => {
    const items = await getResultsFeed(createResultsFeedSupabaseMock() as never);

    expect(items[0]).toMatchObject({
      championBonusPointsAwarded: 25,
      impact: {
        hits: 1,
        misses: 1,
        pointsAwarded: 50,
      },
      type: "FINAL_RESULT",
    });

    expect(items.some((item) => item.type === "GROUP_CLOSURE")).toBe(true);
    expect(items.some((item) => item.type === "GROUP_MATCH_RESULT")).toBe(true);
  });
});

describe("getParticipantExplorerEntries", () => {
  it("marks the current user inside the participants list", async () => {
    mockGetRankingByPhase.mockResolvedValue({
      entries: rankingEntries,
      isLive: true,
    });

    const entries = await getParticipantExplorerEntries({} as never, "user-2");

    expect(entries.map((entry) => ({
      displayName: entry.displayName,
      isCurrentUser: entry.isCurrentUser,
      userId: entry.userId,
    }))).toEqual([
      {
        displayName: "Ana",
        isCurrentUser: false,
        userId: "user-1",
      },
      {
        displayName: "Bruno",
        isCurrentUser: true,
        userId: "user-2",
      },
    ]);
  });
});

describe("getParticipantDetail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateAdminClient.mockReturnValue(createParticipantSupabaseMock() as never);
    mockGetRankingByPhase.mockResolvedValue({
      entries: rankingEntries,
      isLive: true,
    });
    mockGetUserPointsBreakdown.mockResolvedValue({
      champion: 0,
      details: [],
      groupStage: 3,
      knockout: 0,
      total: 3,
    });
    mockGetUserGapCopy.mockReturnValue("Estás a 3 pts de Ana.");
  });

  it("reads revealed participant group picks from the server-side prediction client", async () => {
    mockGetGroupStageLock.mockResolvedValue({
      effectiveLockAt: "2026-06-26T19:00:00Z",
      isLocked: true,
      phase: "GROUP_STAGE",
      source: "AUTOMATIC",
    });
    mockGetPhaseLock.mockImplementation(async (_supabase, phase: string) => ({
      effectiveLockAt: "2026-07-01T19:00:00Z",
      isLocked: false,
      phase,
      source: "AUTOMATIC",
    }));
    mockGetBracketRounds.mockResolvedValue([]);

    const predictionReadClient = {
      from(table: string) {
        if (table === "group_predictions") {
          return {
            select() {
              return {
                eq() {
                  return Promise.resolve({
                    data: [
                      {
                        group_letter: "A",
                        predicted_position: 1,
                        team_id: "team-mex",
                      },
                    ],
                    error: null,
                  });
                },
              };
            },
          };
        }

        throw new Error(`Unexpected table ${table}`);
      },
    };

    const detail = await getParticipantDetail(
      {
        from(table: string) {
          if (table === "group_predictions") {
            return {
              select() {
                return {
                  eq() {
                    return Promise.resolve({
                      data: [],
                      error: null,
                    });
                  },
                };
              },
            };
          }

          if (table === "group_standings") {
            return {
              select() {
                return Promise.resolve({
                  data: [
                    {
                      goal_difference: 4,
                      goals_for: 6,
                      group_letter: "A",
                      is_final: true,
                      points: 7,
                      position: 1,
                      qualification_status: "QUALIFIED_FIRST",
                      team_id: "team-mex",
                      updated_at: "2026-06-20T22:00:00Z",
                    },
                  ],
                  error: null,
                });
              },
            };
          }

          if (table === "teams") {
            return {
              select() {
                return {
                  in() {
                    return Promise.resolve({
                      data: [
                        {
                          code: "MEX",
                          flag_url: "https://flagcdn.com/mx.svg",
                          id: "team-mex",
                          is_tbd: false,
                          name: "Mexico",
                        },
                      ],
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
                return {
                  eq() {
                    return Promise.resolve({
                      data: [],
                      error: null,
                    });
                  },
                };
              },
            };
          }

          throw new Error(`Unexpected table ${table}`);
        },
      } as never,
      "user-1",
      "user-2",
      {
        predictionReadClient: predictionReadClient as never,
      },
    );

    expect(detail?.groups[0]).toMatchObject({
      groupLetter: "A",
      revealState: "VISIBLE_RESOLVED",
      savedCount: 1,
    });
    expect(detail?.groups[0]?.teams[0]).toMatchObject({
      id: "team-mex",
      name: "Mexico",
      predictedPosition: 1,
    });
    expect(mockGetBracketRounds).toHaveBeenCalledWith(
      expect.anything(),
      "user-2",
      expect.objectContaining({
        predictionsClient: predictionReadClient,
      }),
    );
  });

  it("keeps other users hidden until the corresponding lock closes", async () => {
    mockGetGroupStageLock.mockResolvedValue({
      effectiveLockAt: "2026-06-26T19:00:00Z",
      isLocked: false,
      phase: "GROUP_STAGE",
      source: "AUTOMATIC",
    });
    mockGetPhaseLock.mockImplementation(async (_supabase, phase: string) => ({
      effectiveLockAt: "2026-07-01T19:00:00Z",
      isLocked: false,
      phase,
      source: "AUTOMATIC",
    }));
    mockGetBracketRounds.mockResolvedValue([
      {
        label: "Dieciseisavos de final",
        matches: [
          {
            awaySlot: {
              code: "USA",
              flagUrl: null,
              id: "team-usa",
              isKnown: true,
              isTbd: false,
              name: "United States",
            },
            canPredict: false,
            city: "Los Angeles",
            homeSlot: {
              code: "MEX",
              flagUrl: null,
              id: "team-mex",
              isKnown: true,
              isTbd: false,
              name: "Mexico",
            },
            id: "match-73",
            isFinal: false,
            kickoff: "2026-06-28T19:00:00Z",
            lock: {
              effectiveLockAt: "2026-06-28T19:00:00Z",
              isLocked: false,
              phase: "KNOCKOUT_STAGE_ONE",
              source: "AUTOMATIC",
            },
            matchNumber: 73,
            phase: "ROUND_OF_32",
            prediction: {
              canonicalMatchNumber: 73,
              currentWinnerSlot: "HOME",
              isOutdated: false,
              isRandom: false,
              predictedWinnerSlot: "HOME",
              predictedWinnerTeam: {
                code: "MEX",
                flagUrl: null,
                id: "team-mex",
                isKnown: true,
                isTbd: false,
                name: "Mexico",
              },
              warningState: "NONE",
            },
            venue: "SoFi",
            windowLabel: "Ventana 1",
            windowState: "EDITABLE",
          },
        ],
        phase: "ROUND_OF_32",
      },
    ]);

    const detail = await getParticipantDetail(
      createParticipantSupabaseMock() as never,
      "user-1",
      "user-2",
    );

    expect(detail?.groups[0]?.revealState).toBe("HIDDEN_UNTIL_LOCK");
    expect(detail?.bracketRounds[0]?.revealState).toBe("HIDDEN_UNTIL_LOCK");
    expect(detail?.bracketRounds[0]?.matches[0]?.prediction).toBeNull();
  });

  it("reveals resolved picks after the lock and marks the correct state", async () => {
    mockGetGroupStageLock.mockResolvedValue({
      effectiveLockAt: "2026-06-26T19:00:00Z",
      isLocked: true,
      phase: "GROUP_STAGE",
      source: "AUTOMATIC",
    });
    mockGetPhaseLock.mockImplementation(async (_supabase, phase: string) => ({
      effectiveLockAt: "2026-07-01T19:00:00Z",
      isLocked: true,
      phase,
      source: "AUTOMATIC",
    }));
    mockGetBracketRounds.mockResolvedValue([
      {
        label: "Dieciseisavos de final",
        matches: [
          {
            awaySlot: {
              code: "USA",
              flagUrl: null,
              id: "team-usa",
              isKnown: true,
              isTbd: false,
              name: "United States",
            },
            canPredict: false,
            city: "Los Angeles",
            homeSlot: {
              code: "MEX",
              flagUrl: null,
              id: "team-mex",
              isKnown: true,
              isTbd: false,
              name: "Mexico",
            },
            id: "match-73",
            isFinal: false,
            kickoff: "2026-06-28T19:00:00Z",
            lock: {
              effectiveLockAt: "2026-06-28T19:00:00Z",
              isLocked: true,
              phase: "KNOCKOUT_STAGE_ONE",
              source: "AUTOMATIC",
            },
            matchNumber: 73,
            phase: "ROUND_OF_32",
            prediction: {
              canonicalMatchNumber: 73,
              currentWinnerSlot: "HOME",
              isOutdated: false,
              isRandom: false,
              predictedWinnerSlot: "HOME",
              predictedWinnerTeam: {
                code: "MEX",
                flagUrl: null,
                id: "team-mex",
                isKnown: true,
                isTbd: false,
                name: "Mexico",
              },
              warningState: "NONE",
            },
            venue: "SoFi",
            windowLabel: "Ventana 1",
            windowState: "LOCKED",
          },
        ],
        phase: "ROUND_OF_32",
      },
    ]);

    const detail = await getParticipantDetail(
      {
        from(table: string) {
          if (table === "group_predictions") {
            return {
              select() {
                return {
                  eq() {
                    return Promise.resolve({
                      data: [
                        {
                          group_letter: "A",
                          predicted_position: 1,
                          team_id: "team-mex",
                        },
                      ],
                      error: null,
                    });
                  },
                };
              },
            };
          }

          if (table === "group_standings") {
            return {
              select() {
                return Promise.resolve({
                  data: [
                    {
                      goal_difference: 4,
                      goals_for: 6,
                      group_letter: "A",
                      is_final: true,
                      points: 7,
                      position: 1,
                      qualification_status: "QUALIFIED_FIRST",
                      team_id: "team-mex",
                      updated_at: "2026-06-20T22:00:00Z",
                    },
                  ],
                  error: null,
                });
              },
            };
          }

          if (table === "teams") {
            return {
              select() {
                return {
                  in() {
                    return Promise.resolve({
                      data: [
                        {
                          code: "MEX",
                          flag_url: "https://flagcdn.com/mx.svg",
                          id: "team-mex",
                          is_tbd: false,
                          name: "Mexico",
                        },
                      ],
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
                return {
                  eq() {
                    return Promise.resolve({
                      data: [
                        {
                          metadata: {
                            actualPosition: 1,
                            groupLetter: "A",
                            matchId: "match-73",
                            stamp: "+4 pts",
                            teamId: "team-mex",
                            winnerSide: "HOME",
                          },
                          points_awarded: 4,
                          source_id: "knockout_match_73",
                          source_type: "KNOCKOUT_WINNER",
                          user_id: "user-2",
                        },
                      ],
                      error: null,
                    });
                  },
                };
              },
            };
          }

          throw new Error(`Unexpected table ${table}`);
        },
      } as never,
      "user-1",
      "user-2",
    );

    expect(detail?.groups[0]?.revealState).toBe("VISIBLE_RESOLVED");
    expect(detail?.bracketRounds[0]?.matches[0]).toMatchObject({
      awardedPoints: 4,
      resolutionState: "CORRECT",
    });
  });

  it("marks a knockout pick as wrong when the slot wins but the saved team does not", async () => {
    mockGetGroupStageLock.mockResolvedValue({
      effectiveLockAt: "2026-06-26T19:00:00Z",
      isLocked: true,
      phase: "GROUP_STAGE",
      source: "AUTOMATIC",
    });
    mockGetPhaseLock.mockImplementation(async (_supabase, phase: string) => ({
      effectiveLockAt: "2026-07-01T19:00:00Z",
      isLocked: true,
      phase,
      source: "AUTOMATIC",
    }));
    mockGetBracketRounds.mockResolvedValue([
      {
        label: "Octavos de final",
        matches: [
          {
            awaySlot: {
              code: "PAR",
              flagUrl: null,
              id: "team-par",
              isKnown: true,
              isTbd: false,
              name: "Paraguay",
            },
            canPredict: false,
            city: "Dallas",
            homeSlot: {
              code: "BRA",
              flagUrl: null,
              id: "team-bra",
              isKnown: true,
              isTbd: false,
              name: "Brazil",
            },
            id: "match-89",
            isFinal: false,
            kickoff: "2026-07-04T19:00:00Z",
            lock: {
              effectiveLockAt: "2026-06-28T19:00:00Z",
              isLocked: true,
              phase: "KNOCKOUT_STAGE_ONE",
              source: "AUTOMATIC",
            },
            matchNumber: 89,
            phase: "ROUND_OF_16",
            prediction: {
              canonicalMatchNumber: 89,
              currentWinnerSlot: null,
              isOutdated: true,
              isRandom: false,
              predictedWinnerSlot: "AWAY",
              predictedWinnerTeam: {
                code: "GER",
                flagUrl: null,
                id: "team-ger",
                isKnown: true,
                isTbd: false,
                name: "Germany",
              },
              warningState: "STALE_UNRESOLVED",
            },
            venue: "AT&T Stadium",
            windowLabel: "Ventana 1",
            windowState: "LOCKED",
          },
        ],
        phase: "ROUND_OF_16",
      },
    ]);

    const detail = await getParticipantDetail(
      {
        from(table: string) {
          if (table === "group_predictions") {
            return {
              select() {
                return {
                  eq() {
                    return Promise.resolve({
                      data: [],
                      error: null,
                    });
                  },
                };
              },
            };
          }

          if (table === "group_standings") {
            return {
              select() {
                return Promise.resolve({
                  data: [],
                  error: null,
                });
              },
            };
          }

          if (table === "teams") {
            return {
              select() {
                return {
                  in() {
                    return Promise.resolve({
                      data: [],
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
                return {
                  eq() {
                    return Promise.resolve({
                      data: [
                        {
                          metadata: {
                            actualWinnerTeamId: "team-par",
                            matchId: "match-89",
                            predictedWinnerSlot: "AWAY",
                            predictedWinnerTeamId: "team-ger",
                            stamp: "Miss",
                            winnerSide: "AWAY",
                          },
                          points_awarded: 0,
                          source_id: "knockout_match_match-89",
                          source_type: "KNOCKOUT_WINNER",
                          user_id: "user-2",
                        },
                      ],
                      error: null,
                    });
                  },
                };
              },
            };
          }

          throw new Error(`Unexpected table ${table}`);
        },
      } as never,
      "user-1",
      "user-2",
    );

    expect(detail?.bracketRounds[0]?.matches[0]).toMatchObject({
      awardedPoints: 0,
      prediction: {
        isOutdated: true,
        predictedWinnerSlot: "AWAY",
      },
      resolutionState: "WRONG",
    });
  });
});
