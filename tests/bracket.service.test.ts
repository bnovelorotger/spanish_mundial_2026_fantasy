import { describe, expect, it } from "vitest";

import {
  canPredictKnockoutMatch,
  isKnockoutRoundPhase,
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

    expect(result.error).toBe("That knockout round is locked.");
  });

  it("rejects picks when both teams are not known", () => {
    const result = validateKnockoutPredictionInput({
      awaySlot: placeholderAwaySlot,
      homeSlot: knownHomeSlot,
      isLocked: false,
      predictedWinnerTeamId: "team-1",
    });

    expect(result.error).toBe(
      "Pick a winner once both knockout teams are known.",
    );
  });

  it("rejects winners outside the two teams on the card", () => {
    const result = validateKnockoutPredictionInput({
      awaySlot: knownAwaySlot,
      homeSlot: knownHomeSlot,
      isLocked: false,
      predictedWinnerTeamId: "outsider",
    });

    expect(result.error).toBe("Choose one of the teams on the bracket card.");
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
