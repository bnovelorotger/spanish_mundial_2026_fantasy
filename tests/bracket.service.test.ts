import type { SupabaseClient } from "@supabase/supabase-js";
import { describe, expect, it, vi } from "vitest";

const { mockGetPhaseLock } = vi.hoisted(() => ({
  mockGetPhaseLock: vi.fn(),
}));

vi.mock("@/lib/services/locks.service", () => ({
  getPhaseLock: mockGetPhaseLock,
}));

import {
  getKnockoutSeedSpec,
  getKnockoutSlotLabel,
  resolveKnockoutSeedTeam,
} from "@/lib/knockout-bracket";
import {
  canPredictKnockoutMatch,
  getBracketRounds,
  isKnockoutRoundPhase,
  parseKnockoutPredictionFormData,
  resolveQualifiedPlaceholderTeam,
  saveKnockoutPrediction,
  validateKnockoutPredictionInput,
} from "@/lib/services/bracket.service";

describe("isKnockoutRoundPhase", () => {
  it("accepts only the configured knockout phases", () => {
    expect(isKnockoutRoundPhase("ROUND_OF_32")).toBe(true);
    expect(isKnockoutRoundPhase("FINAL")).toBe(true);
    expect(isKnockoutRoundPhase("THIRD_PLACE")).toBe(false);
  });
});

describe("canPredictKnockoutMatch", () => {
  it("allows slot picks while the active window is editable", () => {
    expect(
      canPredictKnockoutMatch({
        windowState: "EDITABLE",
      }),
    ).toBe(true);
  });

  it("blocks slot picks outside the editable window", () => {
    expect(
      canPredictKnockoutMatch({
        windowState: "UPCOMING",
      }),
    ).toBe(false);
  });
});

describe("validateKnockoutPredictionInput", () => {
  it("rejects locked knockout windows", () => {
    const result = validateKnockoutPredictionInput({
      predictedWinnerSlot: "HOME",
      windowState: "LOCKED",
    });

    expect(result.error).toBe("Esa ventana de eliminatorias ya está cerrada.");
  });

  it("rejects rounds that belong to the upcoming knockout window", () => {
    const result = validateKnockoutPredictionInput({
      predictedWinnerSlot: "HOME",
      windowState: "UPCOMING",
    });

    expect(result.error).toBe(
      "Esa ronda se abre en la segunda ventana de eliminatorias.",
    );
  });

  it("accepts a valid winner-side selection", () => {
    const result = validateKnockoutPredictionInput({
      predictedWinnerSlot: "AWAY",
      windowState: "EDITABLE",
    });

    expect(result.data).toEqual({
      predictedWinnerSlot: "AWAY",
    });
  });
});

describe("saveKnockoutPrediction", () => {
  it("upserts the chosen side for the user and match", async () => {
    mockGetPhaseLock.mockResolvedValue({
      effectiveLockAt: "2026-06-28T19:00:00Z",
      isLocked: false,
      phase: "KNOCKOUT_STAGE_ONE",
      source: "AUTOMATIC",
    });

    const mockUpsert = vi.fn().mockResolvedValue({ error: null });
    const supabase = {
      from(table: string) {
        if (table === "matches") {
          return {
            select() {
              return {
                in: async () => ({
                  data: [
                    {
                      away_placeholder: null,
                      away_team_id: "team-can",
                      away_team: {
                        code: "CAN",
                        flag_url: "https://flagcdn.com/w80/ca.png",
                        id: "team-can",
                        is_tbd: false,
                        name: "Canada",
                      },
                      id: "match-73",
                      home_team_id: "team-rsa",
                      home_placeholder: null,
                      home_team: {
                        code: "RSA",
                        flag_url: "https://flagcdn.com/w80/za.png",
                        id: "team-rsa",
                        is_tbd: false,
                        name: "South Africa",
                      },
                      match_number: 73,
                      phase: "ROUND_OF_32",
                      status: "SCHEDULED",
                      winner_side: null,
                    },
                  ],
                  error: null,
                }),
              };
            },
          };
        }

        if (table === "group_standings") {
          return {
            select: async () => ({
              data: [],
              error: null,
            }),
          };
        }

        if (table === "knockout_predictions") {
          return {
            select() {
              return {
                eq: async () => ({
                  data: [],
                  error: null,
                }),
              };
            },
            upsert: mockUpsert,
          };
        }

        throw new Error(`Unexpected table ${table}`);
      },
    } as unknown as SupabaseClient;

    await saveKnockoutPrediction(supabase, "user-1", {
      matchId: "match-73",
      phase: "ROUND_OF_32",
      predictedWinnerSlot: "AWAY",
    });

    expect(mockUpsert).toHaveBeenCalledTimes(1);
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        confirmed_by: "user-1",
        is_random: false,
        match_id: "match-73",
        predicted_winner_slot: "AWAY",
        predicted_winner_team_id: "team-can",
        provenance: "USER_SUBMITTED",
        user_id: "user-1",
      }),
      {
        onConflict: "user_id,match_id",
      },
    );
  });
});

describe("getBracketRounds", () => {
  it("reads knockout predictions from the supplied server-side client", async () => {
    mockGetPhaseLock.mockImplementation(async (_supabase, phase: string) => ({
      effectiveLockAt:
        phase === "KNOCKOUT_STAGE_ONE"
          ? "2026-06-28T19:00:00Z"
          : "2026-07-09T19:00:00Z",
      isLocked: false,
      phase,
      source: "AUTOMATIC",
    }));

    const publicSupabase = {
      from(table: string) {
        if (table === "matches") {
          return {
            select() {
              return {
                in() {
                  return {
                    order: async () => ({
                      data: [
                    {
                      away_placeholder: null,
                      away_team_id: "team-can",
                      away_team: {
                        code: "CAN",
                        flag_url: "https://flagcdn.com/ca.svg",
                        id: "team-can",
                        is_tbd: false,
                            name: "Canada",
                          },
                      city: "Mexico City",
                      home_team_id: "team-rsa",
                      home_placeholder: null,
                      home_team: {
                        code: "RSA",
                        flag_url: "https://flagcdn.com/za.svg",
                        id: "team-rsa",
                            is_tbd: false,
                            name: "South Africa",
                          },
                          id: "match-73",
                          kickoff: "2026-06-28T19:00:00Z",
                          match_number: 73,
                          phase: "ROUND_OF_32",
                          status: "SCHEDULED",
                          venue: "Azteca",
                          winner_side: null,
                        },
                      ],
                      error: null,
                    }),
                  };
                },
              };
            },
          };
        }

        if (table === "group_standings") {
          return {
            select: async () => ({
              data: [],
              error: null,
            }),
          };
        }

        if (table === "teams") {
          return {
            select() {
              return {
                in: async () => ({
                  data: [],
                  error: null,
                }),
              };
            },
          };
        }

        if (table === "knockout_predictions") {
          throw new Error("Public client should not read knockout predictions here.");
        }

        throw new Error(`Unexpected table ${table}`);
      },
    } as unknown as SupabaseClient;

    const predictionsClient = {
      from(table: string) {
        if (table === "knockout_predictions") {
          return {
            select() {
              return {
                eq: async () => ({
                  data: [
                    {
                      is_random: false,
                      match_id: "match-73",
                      predicted_winner_slot: "AWAY",
                      predicted_winner_team_id: "team-can",
                      updated_at: "2026-06-27T20:00:00Z",
                    },
                  ],
                  error: null,
                }),
              };
            },
          };
        }

        throw new Error(`Unexpected table ${table}`);
      },
    } as unknown as SupabaseClient;

    const rounds = await getBracketRounds(publicSupabase, "user-2", {
      predictionsClient,
    });

    expect(rounds[0]?.matches[0]?.prediction).toMatchObject({
      canonicalMatchNumber: 73,
      currentWinnerSlot: "AWAY",
      isOutdated: false,
      predictedWinnerSlot: "AWAY",
      predictedWinnerTeam: {
        id: "team-can",
        name: "Canada",
      },
      warningState: "NONE",
    });
  });

  it("remaps a saved team to the current match where that team now appears", async () => {
    mockGetPhaseLock.mockImplementation(async (_supabase, phase: string) => ({
      effectiveLockAt:
        phase === "KNOCKOUT_STAGE_ONE"
          ? "2026-06-28T19:00:00Z"
          : "2026-07-09T19:00:00Z",
      isLocked: false,
      phase,
      source: "AUTOMATIC",
    }));

    const supabase = {
      from(table: string) {
        if (table === "matches") {
          return {
            select() {
              return {
                in() {
                  return {
                    order: async () => ({
                      data: [
                        {
                          away_placeholder: null,
                          away_team: {
                            code: "PAR",
                            flag_url: null,
                            id: "team-par",
                            is_tbd: false,
                            name: "Paraguay",
                          },
                          away_team_id: "team-par",
                          city: "Dallas",
                          home_placeholder: null,
                          home_team: {
                            code: "FRA",
                            flag_url: null,
                            id: "team-fra",
                            is_tbd: false,
                            name: "France",
                          },
                          home_team_id: "team-fra",
                          id: "match-90",
                          kickoff: "2026-07-04T19:00:00Z",
                          match_number: 90,
                          phase: "ROUND_OF_16",
                          status: "SCHEDULED",
                          venue: "AT&T Stadium",
                          winner_side: null,
                        },
                        {
                          away_placeholder: null,
                          away_team: {
                            code: "NOR",
                            flag_url: null,
                            id: "team-nor",
                            is_tbd: false,
                            name: "Norway",
                          },
                          away_team_id: "team-nor",
                          city: "Houston",
                          home_placeholder: null,
                          home_team: {
                            code: "BRA",
                            flag_url: null,
                            id: "team-bra",
                            is_tbd: false,
                            name: "Brazil",
                          },
                          home_team_id: "team-bra",
                          id: "match-91",
                          kickoff: "2026-07-05T22:00:00Z",
                          match_number: 91,
                          phase: "ROUND_OF_16",
                          status: "SCHEDULED",
                          venue: "NRG Stadium",
                          winner_side: null,
                        },
                      ],
                      error: null,
                    }),
                  };
                },
              };
            },
          };
        }

        if (table === "group_standings") {
          return {
            select: async () => ({
              data: [],
              error: null,
            }),
          };
        }

        if (table === "teams") {
          return {
            select() {
              return {
                in: async () => ({
                  data: [],
                  error: null,
                }),
              };
            },
          };
        }

        if (table === "knockout_predictions") {
          return {
            select() {
              return {
                eq: async () => ({
                  data: [
                    {
                      is_random: false,
                      match_id: "match-90",
                      predicted_winner_slot: "AWAY",
                      predicted_winner_team_id: "team-bra",
                      updated_at: "2026-07-04T12:00:00Z",
                    },
                  ],
                  error: null,
                }),
              };
            },
          };
        }

        throw new Error(`Unexpected table ${table}`);
      },
    } as unknown as SupabaseClient;

    const rounds = await getBracketRounds(supabase, "user-1");
    const roundOf16 = rounds.find((round) => round.phase === "ROUND_OF_16");

    expect(roundOf16?.matches.find((match) => match.id === "match-90")?.prediction).toBeNull();
    expect(
      roundOf16?.matches.find((match) => match.id === "match-91")?.prediction,
    ).toMatchObject({
      canonicalMatchNumber: 91,
      currentWinnerSlot: "HOME",
      predictedWinnerSlot: "HOME",
      predictedWinnerTeam: {
        id: "team-bra",
        name: "Brazil",
      },
      warningState: "NONE",
    });
  });
});

describe("parseKnockoutPredictionFormData", () => {
  it("parses a valid knockout prediction payload", () => {
    const formData = new FormData();
    formData.set("match_id", "match-1");
    formData.set("phase", "ROUND_OF_16");
    formData.set("predicted_winner_slot", "HOME");

    expect(parseKnockoutPredictionFormData(formData)).toEqual({
      data: {
        matchId: "match-1",
        phase: "ROUND_OF_16",
        predictedWinnerSlot: "HOME",
      },
    });
  });

  it("rejects invalid or incomplete knockout payloads", () => {
    const formData = new FormData();
    formData.set("match_id", "match-1");
    formData.set("phase", "GROUP_STAGE");

    expect(parseKnockoutPredictionFormData(formData)).toEqual({
      error: "No hemos podido resolver ese pronóstico de eliminatorias.",
    });
  });
});

describe("resolveQualifiedPlaceholderTeam", () => {
  const qualifiedStandings = [
    {
      goal_difference: 5,
      goals_for: 7,
      group_letter: "A" as const,
      is_final: true,
      played: 3,
      points: 7,
      position: 1,
      qualification_status: "QUALIFIED_FIRST" as const,
      team: {
        code: "MEX",
        flag_url: "https://flagcdn.com/w80/mx.png",
        id: "team-mex",
        is_tbd: false,
        name: "Mexico",
      },
      team_id: "team-mex",
    },
    {
      goal_difference: 2,
      goals_for: 4,
      group_letter: "A" as const,
      is_final: true,
      played: 3,
      points: 5,
      position: 2,
      qualification_status: "QUALIFIED_SECOND" as const,
      team: {
        code: "RSA",
        flag_url: "https://flagcdn.com/w80/za.png",
        id: "team-rsa",
        is_tbd: false,
        name: "South Africa",
      },
      team_id: "team-rsa",
    },
    {
      goal_difference: 0,
      goals_for: 3,
      group_letter: "B" as const,
      is_final: true,
      played: 3,
      points: 4,
      position: 3,
      qualification_status: "BEST_THIRD" as const,
      team: {
        code: "CHL",
        flag_url: "https://flagcdn.com/w80/cl.png",
        id: "team-chl",
        is_tbd: false,
        name: "Chile",
      },
      team_id: "team-chl",
    },
    {
      goal_difference: 4,
      goals_for: 6,
      group_letter: "C" as const,
      is_final: false,
      played: 2,
      points: 4,
      position: 1,
      qualification_status: "QUALIFIED_FIRST" as const,
      team: {
        code: "ESP",
        flag_url: "https://flagcdn.com/w80/es.png",
        id: "team-esp",
        is_tbd: false,
        name: "Spain",
      },
      team_id: "team-esp",
    },
  ];

  it("resolves final-group winners and runners-up into real teams", () => {
    expect(
      resolveQualifiedPlaceholderTeam("Winner Group A", qualifiedStandings),
    )?.toMatchObject({
      code: "MEX",
      id: "team-mex",
      name: "Mexico",
    });

    expect(
      resolveQualifiedPlaceholderTeam("Runner-up Group A", qualifiedStandings),
    )?.toMatchObject({
      code: "RSA",
      id: "team-rsa",
      name: "South Africa",
    });
  });

  it("resolves final best-third placeholders only when qualification is confirmed", () => {
    expect(
      resolveQualifiedPlaceholderTeam("Best Third Group B", qualifiedStandings),
    )?.toMatchObject({
      code: "CHL",
      id: "team-chl",
      name: "Chile",
    });
  });

  it("does not resolve non-final groups or unrelated placeholders", () => {
    expect(
      resolveQualifiedPlaceholderTeam("Winner Group C", qualifiedStandings),
    ).toBeNull();
    expect(
      resolveQualifiedPlaceholderTeam(
        "Winner Round of 16 Slot 1",
        qualifiedStandings,
      ),
    ).toBeNull();
  });
});

describe("knockout bracket seeds", () => {
  const standings = [
    {
      goal_difference: 5,
      goals_for: 7,
      group_letter: "A" as const,
      is_final: true,
      played: 3,
      points: 7,
      position: 1,
      qualification_status: "QUALIFIED_FIRST" as const,
      team: {
        code: "MEX",
        flag_url: "https://flagcdn.com/w80/mx.png",
        id: "team-mex",
        is_tbd: false,
        name: "Mexico",
      },
      team_id: "team-mex",
    },
    {
      goal_difference: 2,
      goals_for: 4,
      group_letter: "A" as const,
      is_final: true,
      played: 3,
      points: 5,
      position: 2,
      qualification_status: "QUALIFIED_SECOND" as const,
      team: {
        code: "RSA",
        flag_url: "https://flagcdn.com/w80/za.png",
        id: "team-rsa",
        is_tbd: false,
        name: "South Africa",
      },
      team_id: "team-rsa",
    },
    {
      goal_difference: -1,
      goals_for: 3,
      group_letter: "A" as const,
      is_final: true,
      played: 3,
      points: 4,
      position: 3,
      qualification_status: "BEST_THIRD" as const,
      team: {
        code: "KOR",
        flag_url: "https://flagcdn.com/w80/kr.png",
        id: "team-kor",
        is_tbd: false,
        name: "South Korea",
      },
      team_id: "team-kor",
    },
    {
      goal_difference: -6,
      goals_for: 1,
      group_letter: "A" as const,
      is_final: true,
      played: 3,
      points: 0,
      position: 4,
      qualification_status: "ELIMINATED" as const,
      team: {
        code: "CZE",
        flag_url: "https://flagcdn.com/w80/cz.png",
        id: "team-cze",
        is_tbd: false,
        name: "Czechia",
      },
      team_id: "team-cze",
    },
    {
      goal_difference: 3,
      goals_for: 5,
      group_letter: "I" as const,
      is_final: false,
      played: 2,
      points: 4,
      position: 1,
      qualification_status: "QUALIFIED_FIRST" as const,
      team: {
        code: "FRA",
        flag_url: "https://flagcdn.com/w80/fr.png",
        id: "team-fra",
        is_tbd: false,
        name: "France",
      },
      team_id: "team-fra",
    },
    {
      goal_difference: 1,
      goals_for: 3,
      group_letter: "I" as const,
      is_final: false,
      played: 2,
      points: 4,
      position: 2,
      qualification_status: "QUALIFIED_SECOND" as const,
      team: {
        code: "NOR",
        flag_url: "https://flagcdn.com/w80/no.png",
        id: "team-nor",
        is_tbd: false,
        name: "Norway",
      },
      team_id: "team-nor",
    },
    {
      goal_difference: 0,
      goals_for: 2,
      group_letter: "I" as const,
      is_final: false,
      played: 2,
      points: 3,
      position: 3,
      qualification_status: "ELIMINATED" as const,
      team: {
        code: "SEN",
        flag_url: "https://flagcdn.com/w80/sn.png",
        id: "team-sen",
        is_tbd: false,
        name: "Senegal",
      },
      team_id: "team-sen",
    },
    {
      goal_difference: -4,
      goals_for: 1,
      group_letter: "I" as const,
      is_final: false,
      played: 2,
      points: 0,
      position: 4,
      qualification_status: "ELIMINATED" as const,
      team: {
        code: "IRQ",
        flag_url: "https://flagcdn.com/w80/iq.png",
        id: "team-irq",
        is_tbd: false,
        name: "Iraq",
      },
      team_id: "team-irq",
    },
  ];

  it("uses semantic labels from the official 2026 bracket config", () => {
    expect(getKnockoutSlotLabel(73, "HOME")).toBe("Runner-up Group A");
    expect(getKnockoutSlotLabel(79, "AWAY")).toBe(
      "Best 3rd place Group C/E/F/H/I",
    );
    expect(getKnockoutSlotLabel(89, "AWAY")).toBe("Winner Match 75");
  });

  it("resolves exact final seeds but keeps ambiguous non-final seeds unresolved", () => {
    const winnerGroupA = getKnockoutSeedSpec(79, "HOME");
    const winnerGroupI = getKnockoutSeedSpec(77, "HOME");

    expect(winnerGroupA).not.toBeNull();
    expect(winnerGroupI).not.toBeNull();

    expect(
      resolveKnockoutSeedTeam({
        matchesByNumber: new Map(),
        seed: winnerGroupA!,
        standings,
      }),
    )?.toMatchObject({
      code: "MEX",
      name: "Mexico",
    });

    expect(
      resolveKnockoutSeedTeam({
        matchesByNumber: new Map(),
        seed: winnerGroupI!,
        standings,
      }),
    ).toBeNull();
  });

  it("does not resolve exact group seeds from partial standings snapshots", () => {
    const winnerGroupA = getKnockoutSeedSpec(79, "HOME");

    expect(
      resolveKnockoutSeedTeam({
        matchesByNumber: new Map(),
        seed: winnerGroupA!,
        standings: standings.filter((row) => row.team_id !== "team-cze"),
      }),
    ).toBeNull();
  });

  it("propagates resolved winners from previous matches", () => {
    const quarterFinalSeed = getKnockoutSeedSpec(89, "HOME");

    expect(
      resolveKnockoutSeedTeam({
        matchesByNumber: new Map([
          [
            73,
            {
              away_team: null,
              home_team: null,
              match_number: 73,
              phase: "ROUND_OF_32",
              status: "FINISHED",
              winner_side: "HOME",
            },
          ],
        ]),
        seed: quarterFinalSeed!,
        standings,
      }),
    )?.toMatchObject({
      code: "RSA",
      name: "South Africa",
    });
  });

  it("propagates saved picks through upcoming matches so the user can preview later rounds", () => {
    const roundOf16Seed = getKnockoutSeedSpec(92, "HOME");

    expect(
      resolveKnockoutSeedTeam({
        matchesByNumber: new Map([
          [
            79,
            {
              away_team: null,
              home_team: null,
              match_number: 79,
              phase: "ROUND_OF_32",
              status: "SCHEDULED",
              winner_side: null,
            },
          ],
        ]),
        predictedWinnersByMatchNumber: new Map([[79, "HOME"]]),
        seed: roundOf16Seed!,
        standings,
        targetWindowPhase: "KNOCKOUT_STAGE_ONE",
      }),
    )?.toMatchObject({
      code: "MEX",
      name: "Mexico",
    });
  });

  it("keeps the saved path within the same knockout window even if the source match is finished", () => {
    const roundOf16Seed = getKnockoutSeedSpec(92, "HOME");

    expect(
      resolveKnockoutSeedTeam({
        matchesByNumber: new Map([
          [
            79,
            {
              away_team: {
                code: "BRA",
                flag_url: null,
                id: "team-bra",
                is_tbd: false,
                name: "Brazil",
              },
              home_team: {
                code: "MEX",
                flag_url: null,
                id: "team-mex",
                is_tbd: false,
                name: "Mexico",
              },
              match_number: 79,
              phase: "ROUND_OF_32",
              status: "FINISHED",
              winner_side: "HOME",
            },
          ],
        ]),
        predictedWinnersByMatchNumber: new Map([[79, "AWAY"]]),
        seed: roundOf16Seed!,
        standings,
        targetWindowPhase: "KNOCKOUT_STAGE_ONE",
      }),
    )?.toMatchObject({
      code: "BRA",
      name: "Brazil",
    });
  });

  it("uses the official finished winner when resolving a later knockout window", () => {
    const quarterFinalSeed = getKnockoutSeedSpec(97, "HOME");

    expect(
      resolveKnockoutSeedTeam({
        matchesByNumber: new Map([
          [
            89,
            {
              away_team: {
                code: "MAR",
                flag_url: null,
                id: "team-mar",
                is_tbd: false,
                name: "Morocco",
              },
              home_team: {
                code: "CAN",
                flag_url: null,
                id: "team-can",
                is_tbd: false,
                name: "Canada",
              },
              match_number: 89,
              phase: "ROUND_OF_16",
              status: "FINISHED",
              winner_side: "AWAY",
            },
          ],
        ]),
        predictedWinnersByMatchNumber: new Map([[89, "HOME"]]),
        seed: quarterFinalSeed!,
        standings,
        targetWindowPhase: "KNOCKOUT_STAGE_TWO",
      }),
    )?.toMatchObject({
      code: "MAR",
      name: "Morocco",
    });
  });
});
