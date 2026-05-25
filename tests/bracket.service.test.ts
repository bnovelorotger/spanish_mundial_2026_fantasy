import { describe, expect, it } from "vitest";

import {
  canPredictKnockoutMatch,
  isKnockoutRoundPhase,
  parseKnockoutPredictionFormData,
  validateKnockoutPredictionInput,
} from "@/lib/services/bracket.service";

const knownHomeSlot = {
  code: "ARG",
  flagUrl: null,
  id: "team-1",
  isKnown: true,
  isTbd: false,
  name: "Argentina",
};

const knownAwaySlot = {
  code: "BRA",
  flagUrl: null,
  id: "team-2",
  isKnown: true,
  isTbd: false,
  name: "Brazil",
};

const placeholderAwaySlot = {
  code: null,
  flagUrl: null,
  id: null,
  isKnown: false,
  isTbd: true,
  name: "Winner Group A",
};

describe("isKnockoutRoundPhase", () => {
  it("accepts only the configured knockout phases", () => {
    expect(isKnockoutRoundPhase("ROUND_OF_32")).toBe(true);
    expect(isKnockoutRoundPhase("FINAL")).toBe(true);
    expect(isKnockoutRoundPhase("THIRD_PLACE")).toBe(false);
  });
});

describe("canPredictKnockoutMatch", () => {
  it("allows winner picks only when both teams are known and unlocked", () => {
    expect(
      canPredictKnockoutMatch({
        awaySlot: knownAwaySlot,
        homeSlot: knownHomeSlot,
        isLocked: false,
      }),
    ).toBe(true);
  });

  it("blocks winner picks when a bracket slot is still a placeholder", () => {
    expect(
      canPredictKnockoutMatch({
        awaySlot: placeholderAwaySlot,
        homeSlot: knownHomeSlot,
        isLocked: false,
      }),
    ).toBe(false);
  });
});

describe("validateKnockoutPredictionInput", () => {
  it("rejects locked rounds", () => {
    const result = validateKnockoutPredictionInput({
      awaySlot: knownAwaySlot,
      homeSlot: knownHomeSlot,
      isLocked: true,
      predictedWinnerTeamId: "team-1",
    });

    expect(result.error).toBe("Esa ronda de eliminatorias ya está cerrada.");
  });

  it("rejects picks when both teams are not known", () => {
    const result = validateKnockoutPredictionInput({
      awaySlot: placeholderAwaySlot,
      homeSlot: knownHomeSlot,
      isLocked: false,
      predictedWinnerTeamId: "team-1",
    });

    expect(result.error).toBe(
      "Elige un ganador cuando ya se conozcan los dos equipos del cruce.",
    );
  });

  it("rejects winners outside the two teams on the card", () => {
    const result = validateKnockoutPredictionInput({
      awaySlot: knownAwaySlot,
      homeSlot: knownHomeSlot,
      isLocked: false,
      predictedWinnerTeamId: "outsider",
    });

    expect(result.error).toBe("Elige uno de los equipos que aparecen en la tarjeta del cruce.");
  });

  it("accepts a valid winner selection", () => {
    const result = validateKnockoutPredictionInput({
      awaySlot: knownAwaySlot,
      homeSlot: knownHomeSlot,
      isLocked: false,
      predictedWinnerTeamId: "team-2",
    });

    expect(result.data).toEqual({
      predictedWinnerTeamId: "team-2",
    });
  });
});

describe("parseKnockoutPredictionFormData", () => {
  it("parses a valid knockout prediction payload", () => {
    const formData = new FormData();
    formData.set("match_id", "match-1");
    formData.set("phase", "ROUND_OF_16");
    formData.set("predicted_winner_team_id", "team-1");

    expect(parseKnockoutPredictionFormData(formData)).toEqual({
      data: {
        matchId: "match-1",
        phase: "ROUND_OF_16",
        predictedWinnerTeamId: "team-1",
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
