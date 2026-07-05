import { describe, expect, it, vi } from "vitest";

import { buildCanonicalKnockoutPredictionMap } from "@/lib/knockout-predictions";

describe("buildCanonicalKnockoutPredictionMap", () => {
  it("keeps the saved team visible when it stays in the same match but changes side", () => {
    const result = buildCanonicalKnockoutPredictionMap({
      matches: [
        {
          away_team_id: "team-bel",
          home_team_id: "team-usa",
          id: "match-94",
          match_number: 94,
          phase: "QUARTER_FINALS",
        },
      ],
      predictions: [
        {
          is_random: false,
          match_id: "match-94",
          predicted_winner_slot: "HOME",
          predicted_winner_team_id: "team-bel",
          updated_at: "2026-07-04T12:00:00Z",
          user_id: "user-1",
        },
      ],
    });

    expect(result.predictionsByMatchId.get("match-94")).toMatchObject({
      canonicalMatchId: "match-94",
      currentWinnerSlot: "AWAY",
      predictedWinnerSlot: "AWAY",
      predictedWinnerTeamId: "team-bel",
      warningState: "NONE",
    });
  });

  it("remaps a saved team into the current match where that team now appears", () => {
    const result = buildCanonicalKnockoutPredictionMap({
      matches: [
        {
          away_team_id: "team-par",
          home_team_id: "team-fra",
          id: "match-90",
          match_number: 90,
          phase: "ROUND_OF_16",
        },
        {
          away_team_id: "team-nor",
          home_team_id: "team-bra",
          id: "match-91",
          match_number: 91,
          phase: "ROUND_OF_16",
        },
      ],
      predictions: [
        {
          is_random: false,
          match_id: "match-90",
          predicted_winner_slot: "AWAY",
          predicted_winner_team_id: "team-bra",
          updated_at: "2026-07-04T12:00:00Z",
          user_id: "user-1",
        },
        {
          is_random: false,
          match_id: "match-91",
          predicted_winner_slot: "HOME",
          predicted_winner_team_id: "team-fra",
          updated_at: "2026-07-04T12:05:00Z",
          user_id: "user-1",
        },
      ],
    });

    expect(result.predictionsByMatchId.get("match-90")).toMatchObject({
      currentWinnerSlot: "HOME",
      predictedWinnerTeamId: "team-fra",
      sourceMatchId: "match-91",
      warningState: "NONE",
    });
    expect(result.predictionsByMatchId.get("match-91")).toMatchObject({
      currentWinnerSlot: "HOME",
      predictedWinnerTeamId: "team-bra",
      sourceMatchId: "match-90",
      warningState: "NONE",
    });
  });

  it("remaps a saved quarter-final team into the current quarter-final where that team now appears", () => {
    const result = buildCanonicalKnockoutPredictionMap({
      matches: [
        {
          away_team_id: "team-arg",
          home_team_id: "team-bra",
          id: "match-97",
          match_number: 97,
          phase: "QUARTER_FINALS",
        },
        {
          away_team_id: "team-fra",
          home_team_id: "team-mar",
          id: "match-99",
          match_number: 99,
          phase: "QUARTER_FINALS",
        },
      ],
      predictions: [
        {
          is_random: false,
          match_id: "match-97",
          predicted_winner_slot: "AWAY",
          predicted_winner_team_id: "team-fra",
          updated_at: "2026-07-09T12:00:00Z",
          user_id: "user-1",
        },
      ],
    });

    expect(result.predictionsByMatchId.get("match-99")).toMatchObject({
      canonicalMatchId: "match-99",
      canonicalMatchNumber: 99,
      currentWinnerSlot: "AWAY",
      predictedWinnerTeamId: "team-fra",
      sourceMatchId: "match-97",
      warningState: "NONE",
    });
  });

  it("remaps a saved semi-final team into the current semi-final where that team now appears", () => {
    const result = buildCanonicalKnockoutPredictionMap({
      matches: [
        {
          away_team_id: "team-mar",
          home_team_id: "team-bra",
          id: "match-101",
          match_number: 101,
          phase: "SEMI_FINALS",
        },
        {
          away_team_id: "team-fra",
          home_team_id: "team-arg",
          id: "match-102",
          match_number: 102,
          phase: "SEMI_FINALS",
        },
      ],
      predictions: [
        {
          is_random: false,
          match_id: "match-101",
          predicted_winner_slot: "HOME",
          predicted_winner_team_id: "team-fra",
          updated_at: "2026-07-14T12:00:00Z",
          user_id: "user-1",
        },
      ],
    });

    expect(result.predictionsByMatchId.get("match-102")).toMatchObject({
      canonicalMatchId: "match-102",
      canonicalMatchNumber: 102,
      currentWinnerSlot: "AWAY",
      predictedWinnerTeamId: "team-fra",
      sourceMatchId: "match-101",
      warningState: "NONE",
    });
  });

  it("keeps the warning only when the saved team is no longer present in that round", () => {
    const result = buildCanonicalKnockoutPredictionMap({
      matches: [
        {
          away_team_id: "team-par",
          home_team_id: "team-fra",
          id: "match-90",
          match_number: 90,
          phase: "ROUND_OF_16",
        },
      ],
      predictions: [
        {
          is_random: false,
          match_id: "match-90",
          predicted_winner_slot: "AWAY",
          predicted_winner_team_id: "team-bra",
          updated_at: "2026-07-04T12:00:00Z",
          user_id: "user-1",
        },
      ],
    });

    expect(result.predictionsByMatchId.get("match-90")).toMatchObject({
      currentWinnerSlot: null,
      predictedWinnerSlot: "AWAY",
      predictedWinnerTeamId: "team-bra",
      warningState: "STALE_UNRESOLVED",
    });
  });

  it("prefers the prediction already attached to the canonical match when a collision occurs", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = buildCanonicalKnockoutPredictionMap({
      matches: [
        {
          away_team_id: "team-par",
          home_team_id: "team-bra",
          id: "match-91",
          match_number: 91,
          phase: "ROUND_OF_16",
        },
      ],
      predictions: [
        {
          is_random: false,
          match_id: "match-91",
          predicted_winner_slot: "HOME",
          predicted_winner_team_id: "team-bra",
          updated_at: "2026-07-04T12:10:00Z",
          user_id: "user-1",
        },
        {
          is_random: false,
          match_id: "match-90",
          predicted_winner_slot: "AWAY",
          predicted_winner_team_id: "team-bra",
          updated_at: "2026-07-04T12:20:00Z",
          user_id: "user-1",
        },
      ],
    });

    expect(result.predictionsByMatchId.get("match-91")).toMatchObject({
      predictedWinnerTeamId: "team-bra",
      sourceMatchId: "match-91",
    });
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
