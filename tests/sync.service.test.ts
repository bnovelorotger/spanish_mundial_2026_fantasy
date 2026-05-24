import { describe, expect, it } from "vitest";

import {
  getProviderFallbackChain,
  hasMatchPayloadChanged,
  hasStandingPayloadChanged,
  resolveRequestedProviderName,
} from "@/lib/services/sync.service";

describe("resolveRequestedProviderName", () => {
  it("defaults to mock for unknown values", () => {
    expect(resolveRequestedProviderName("unknown")).toBe("mock");
  });

  it("keeps a valid explicit provider", () => {
    expect(resolveRequestedProviderName("static")).toBe("static");
    expect(resolveRequestedProviderName("apifootball")).toBe("apifootball");
  });
});

describe("getProviderFallbackChain", () => {
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
