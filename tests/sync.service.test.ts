import { describe, expect, it } from "vitest";

import {
  applyStaleTeamPrunePlan,
  buildGameLockSyncRows,
  buildStaleTeamPrunePlan,
  getProviderFallbackChain,
  hasMatchPayloadChanged,
  hasStandingPayloadChanged,
  ProviderChainError,
  resolveRequestedProviderName,
  resolveProviderPayload,
  validateProviderPayload,
} from "@/lib/services/sync.service";
import type { WorldCupProvider } from "@/lib/providers/worldcup-provider.types";
import { StaticWorldCupProvider } from "@/lib/providers/static-worldcup-provider";

describe("resolveRequestedProviderName", () => {
  it("defaults to mock for unknown values", () => {
    expect(resolveRequestedProviderName("unknown")).toBe("mock");
  });

  it("keeps a valid explicit provider", () => {
    expect(resolveRequestedProviderName("static")).toBe("static");
    expect(resolveRequestedProviderName("apifootball")).toBe("apifootball");
    expect(resolveRequestedProviderName("footballdata")).toBe("footballdata");
  });
});

describe("getProviderFallbackChain", () => {
  it("uses the approved footballdata -> apifootball -> static -> mock order", () => {
    expect(getProviderFallbackChain("footballdata")).toEqual([
      "footballdata",
      "apifootball",
      "static",
      "mock",
    ]);
  });

  it("uses the approved apifootball -> static -> mock order", () => {
    expect(getProviderFallbackChain("apifootball")).toEqual([
      "apifootball",
      "static",
      "mock",
    ]);
  });

  it("uses mock only when mock is requested", () => {
    expect(getProviderFallbackChain("mock")).toEqual(["mock"]);
  });
});

describe("resolveProviderPayload", () => {
  function createProvider(
    behavior: Partial<Record<"teams" | "matches" | "standings", () => Promise<unknown>>>,
  ): WorldCupProvider {
    return {
      async getMatches() {
        if (behavior.matches) {
          return behavior.matches() as Promise<Awaited<ReturnType<WorldCupProvider["getMatches"]>>>;
        }

        return [
          {
            away_team_code: "MEX",
            home_team_code: "CAN",
            kickoff: "2026-06-11T19:00:00Z",
            match_number: 1,
            phase: "GROUP_STAGE",
            status: "SCHEDULED",
          },
        ];
      },
      async getStandings() {
        if (behavior.standings) {
          return behavior.standings() as Promise<
            Awaited<ReturnType<WorldCupProvider["getStandings"]>>
          >;
        }

        return [
          {
            drawn: 0,
            goal_difference: 1,
            goals_against: 0,
            goals_for: 1,
            group_letter: "A",
            is_final: false,
            lost: 0,
            played: 1,
            points: 3,
            position: 1,
            team_code: "CAN",
            won: 1,
          },
        ];
      },
      async getTeams() {
        if (behavior.teams) {
          return behavior.teams() as Promise<Awaited<ReturnType<WorldCupProvider["getTeams"]>>>;
        }

        return [
          {
            code: "CAN",
            group_letter: "A",
            name: "Canada",
          },
          {
            code: "MEX",
            group_letter: "A",
            name: "Mexico",
          },
        ];
      },
    };
  }

  it("falls back to the next provider and records failures", async () => {
    const providerByName = {
      footballdata: createProvider({
        teams: async () => {
          throw new Error("football-data unavailable");
        },
      }),
      apifootball: createProvider({
        teams: async () => {
          throw new Error("Api provider unavailable");
        },
      }),
      mock: createProvider({}),
      static: createProvider({}),
    } satisfies Record<string, WorldCupProvider>;

    const payload = await resolveProviderPayload(
      "footballdata",
      (providerName) => providerByName[providerName],
    );

    expect(payload.providerUsed).toBe("static");
    expect(payload.providerFailures).toEqual([
      {
        message: "football-data unavailable",
        provider: "footballdata",
      },
      {
        message: "Api provider unavailable",
        provider: "apifootball",
      },
    ]);
  });

  it("falls back when a provider returns inconsistent team references", async () => {
    const providerByName = {
      footballdata: createProvider({
        teams: async () => {
          throw new Error("football-data unavailable");
        },
      }),
      apifootball: createProvider({
        matches: async () => [
          {
            away_team_code: "MEX",
            home_team_code: "DEU",
            kickoff: "2026-06-11T19:00:00Z",
            match_number: 1,
            phase: "GROUP_STAGE",
            status: "SCHEDULED",
          },
        ],
      }),
      mock: createProvider({}),
      static: createProvider({}),
    } satisfies Record<string, WorldCupProvider>;

    const payload = await resolveProviderPayload(
      "footballdata",
      (providerName) => providerByName[providerName],
    );

    expect(payload.providerUsed).toBe("static");
    expect(payload.providerFailures[1]?.message).toContain(
      "Provider payload is missing team data for DEU.",
    );
  });

  it("throws a ProviderChainError when every provider fails", async () => {
    await expect(
      resolveProviderPayload("footballdata", (providerName) =>
        createProvider({
          teams: async () => {
            throw new Error(`${providerName} failed`);
          },
        }),
      ),
    ).rejects.toMatchObject({
      failures: [
        { message: "footballdata failed", provider: "footballdata" },
        { message: "apifootball failed", provider: "apifootball" },
        { message: "static failed", provider: "static" },
        { message: "mock failed", provider: "mock" },
      ],
      name: "ProviderChainError",
    } satisfies Partial<ProviderChainError>);
  });
});

describe("validateProviderPayload", () => {
  it("rejects matches that reference teams missing from the provider teams list", () => {
    expect(() =>
      validateProviderPayload({
        matches: [
          {
            away_team_code: "MEX",
            home_team_code: "CAN",
            kickoff: "2026-06-11T19:00:00Z",
            match_number: 1,
            phase: "GROUP_STAGE",
            status: "SCHEDULED",
          },
        ],
        standings: [],
        teams: [
          {
            code: "MEX",
            group_letter: "A",
            name: "Mexico",
          },
        ],
      }),
    ).toThrow("Provider payload is missing team data for CAN.");
  });
});

describe("StaticWorldCupProvider", () => {
  it("returns a normalized bundled tournament snapshot", async () => {
    const provider = new StaticWorldCupProvider();
    const [teams, matches, standings] = await Promise.all([
      provider.getTeams(),
      provider.getMatches(),
      provider.getStandings(),
    ]);

    expect(teams.length).toBeGreaterThan(0);
    expect(matches.length).toBeGreaterThan(0);
    expect(standings.length).toBeGreaterThan(0);
    expect(teams[0]).toHaveProperty("group_letter");
    expect(matches[0]).toHaveProperty("phase");
    expect(standings[0]).toHaveProperty("position");
  });
});

describe("hasMatchPayloadChanged", () => {
  const baseMatch = {
    away_placeholder: null,
    away_score: 1,
    away_team_id: "team-2",
    city: "Toronto",
    group_letter: "A",
    home_placeholder: null,
    home_score: 1,
    home_team_id: "team-1",
    kickoff: "2026-06-11T19:00:00Z",
    match_number: 1,
    phase: "GROUP_STAGE" as const,
    status: "FINISHED" as const,
    venue: "BMO Field",
  };

  it("returns false when the payload matches the stored row", () => {
    expect(hasMatchPayloadChanged(baseMatch, baseMatch)).toBe(false);
  });

  it("returns true when score or status changed", () => {
    expect(
      hasMatchPayloadChanged(baseMatch, {
        ...baseMatch,
        away_score: 2,
      }),
    ).toBe(true);
  });
});

describe("hasStandingPayloadChanged", () => {
  const baseStanding = {
    drawn: 1,
    goal_difference: 3,
    goals_against: 2,
    goals_for: 5,
    group_letter: "A",
    is_final: true,
    lost: 0,
    played: 3,
    points: 7,
    position: 1,
    qualification_status: "QUALIFIED_FIRST" as const,
    team_id: "team-1",
    won: 2,
  };

  it("returns false when the payload matches the stored row", () => {
    expect(hasStandingPayloadChanged(baseStanding, baseStanding)).toBe(false);
  });

  it("returns true when final ranking data changed", () => {
    expect(
      hasStandingPayloadChanged(baseStanding, {
        ...baseStanding,
        points: 6,
      }),
    ).toBe(true);
  });
});

describe("buildStaleTeamPrunePlan", () => {
  const snapshot = {
    championPredictions: [
      { id: "champion-1", team_id: "team-stale" },
      { id: "champion-2", team_id: "team-keep" },
    ],
    groupPredictions: [
      { id: "group-pred-1", team_id: "team-stale" },
      { id: "group-pred-2", team_id: "team-keep" },
    ],
    groupStandings: [
      { id: "standing-1", team_id: "team-stale" },
      { id: "standing-2", team_id: "team-keep" },
    ],
    knockoutPredictions: [
      { id: "knockout-1", predicted_winner_team_id: "team-stale" },
      { id: "knockout-2", predicted_winner_team_id: "team-keep" },
    ],
    matches: [
      {
        away_placeholder: null,
        away_score: null,
        away_team_id: "team-keep",
        city: "Toronto",
        group_letter: "A",
        home_placeholder: null,
        home_score: null,
        home_team_id: "team-stale",
        id: "match-1",
        kickoff: "2026-06-11T19:00:00Z",
        match_number: 1,
        phase: "GROUP_STAGE" as const,
        status: "SCHEDULED" as const,
        venue: "BMO Field",
      },
      {
        away_placeholder: null,
        away_score: null,
        away_team_id: "team-stale",
        city: "Vancouver",
        group_letter: "A",
        home_placeholder: null,
        home_score: null,
        home_team_id: "team-keep",
        id: "match-2",
        kickoff: "2026-06-12T19:00:00Z",
        match_number: 2,
        phase: "GROUP_STAGE" as const,
        status: "SCHEDULED" as const,
        venue: "BC Place",
      },
    ],
    points: [
      {
        id: "point-1",
        metadata: { teamId: "team-stale" },
        source_id: "group_A_team_team-stale",
        source_type: "GROUP_POSITION" as const,
      },
      {
        id: "point-2",
        metadata: { teamId: "team-keep" },
        source_id: "group_A_team_team-keep",
        source_type: "GROUP_POSITION" as const,
      },
    ],
    teams: [
      { code: "STA", id: "team-stale" },
      { code: "KEP", id: "team-keep" },
    ],
  };

  it("removes teams not in the provider response", () => {
    const plan = buildStaleTeamPrunePlan(snapshot, ["KEP"]);
    const pruned = applyStaleTeamPrunePlan(snapshot, plan);

    expect(plan.staleTeamCodes).toEqual(["STA"]);
    expect(pruned.teams).toEqual([{ code: "KEP", id: "team-keep" }]);
  });

  it("is a no-op when the provider response matches the database", () => {
    const plan = buildStaleTeamPrunePlan(snapshot, ["STA", "KEP"]);
    const pruned = applyStaleTeamPrunePlan(snapshot, plan);

    expect(plan.staleTeamIds).toEqual([]);
    expect(pruned).toEqual(snapshot);
  });

  it("cascades into predictions, standings, points, and neutralized matches", () => {
    const plan = buildStaleTeamPrunePlan(snapshot, ["KEP"]);
    const pruned = applyStaleTeamPrunePlan(snapshot, plan);

    expect(pruned.groupPredictions).toEqual([{ id: "group-pred-2", team_id: "team-keep" }]);
    expect(pruned.knockoutPredictions).toEqual([
      { id: "knockout-2", predicted_winner_team_id: "team-keep" },
    ]);
    expect(pruned.championPredictions).toEqual([
      { id: "champion-2", team_id: "team-keep" },
    ]);
    expect(pruned.groupStandings).toEqual([{ id: "standing-2", team_id: "team-keep" }]);
    expect(pruned.points).toEqual([
      {
        id: "point-2",
        metadata: { teamId: "team-keep" },
        source_id: "group_A_team_team-keep",
        source_type: "GROUP_POSITION",
      },
    ]);
    expect(pruned.matches).toEqual([
      expect.objectContaining({
        away_team_id: "team-keep",
        home_placeholder: "Team unavailable",
        home_team_id: null,
      }),
      expect.objectContaining({
        away_placeholder: "Team unavailable",
        away_team_id: null,
        home_team_id: "team-keep",
      }),
    ]);
  });
});

describe("buildGameLockSyncRows", () => {
  it("pins each phase to its first kickoff and reuses the final for champion", () => {
    const rows = buildGameLockSyncRows([
      { kickoff: "2026-06-11T19:00:00Z", phase: "GROUP_STAGE" },
      { kickoff: "2026-06-10T19:00:00Z", phase: "GROUP_STAGE" },
      { kickoff: "2026-07-01T19:00:00Z", phase: "ROUND_OF_32" },
      { kickoff: "2026-07-12T19:00:00Z", phase: "FINAL" },
      { kickoff: "2026-07-08T19:00:00Z", phase: "SEMI_FINALS" },
    ]);

    expect(rows).toEqual(
      expect.arrayContaining([
        {
          lock_at: "2026-06-10T19:00:00Z",
          locked: false,
          locked_by: "AUTOMATIC",
          phase: "GROUP_STAGE",
        },
        {
          lock_at: "2026-07-01T19:00:00Z",
          locked: false,
          locked_by: "AUTOMATIC",
          phase: "ROUND_OF_32",
        },
        {
          lock_at: "2026-07-12T19:00:00Z",
          locked: false,
          locked_by: "AUTOMATIC",
          phase: "FINAL",
        },
        {
          lock_at: "2026-07-12T19:00:00Z",
          locked: false,
          locked_by: "AUTOMATIC",
          phase: "CHAMPION",
        },
      ]),
    );
  });

  it("keeps manual lock rows untouched", () => {
    const rows = buildGameLockSyncRows(
      [{ kickoff: "2026-07-12T19:00:00Z", phase: "FINAL" }],
      [{ locked: true, locked_by: "MANUAL", phase: "FINAL" }],
    );

    expect(rows.find((row) => row.phase === "FINAL")).toBeUndefined();
    expect(rows.find((row) => row.phase === "CHAMPION")).toEqual({
      lock_at: "2026-07-12T19:00:00Z",
      locked: false,
      locked_by: "AUTOMATIC",
      phase: "CHAMPION",
    });
  });
});
