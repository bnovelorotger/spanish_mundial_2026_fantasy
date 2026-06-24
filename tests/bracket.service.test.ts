import { describe, expect, it } from "vitest";

import {
  canPredictKnockoutMatch,
  isKnockoutRoundPhase,
  parseKnockoutPredictionFormData,
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
