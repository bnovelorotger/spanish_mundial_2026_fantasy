import { describe, expect, it } from "vitest";

import {
  canPredictKnockoutMatch,
  isKnockoutRoundPhase,
  parseKnockoutPredictionFormData,
  resolveQualifiedPlaceholderTeam,
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

describe("resolveQualifiedPlaceholderTeam", () => {
  const qualifiedStandings = [
    {
      group_letter: "A" as const,
      is_final: true,
      position: 1,
      qualification_status: "QUALIFIED_FIRST" as const,
      team: {
        code: "MEX",
        flag_url: "https://flagcdn.com/w80/mx.png",
        id: "team-mex",
        is_tbd: false,
        name: "Mexico",
      },
    },
    {
      group_letter: "A" as const,
      is_final: true,
      position: 2,
      qualification_status: "QUALIFIED_SECOND" as const,
      team: {
        code: "USA",
        flag_url: "https://flagcdn.com/w80/us.png",
        id: "team-usa",
        is_tbd: false,
        name: "United States",
      },
    },
    {
      group_letter: "B" as const,
      is_final: true,
      position: 3,
      qualification_status: "BEST_THIRD" as const,
      team: {
        code: "CHL",
        flag_url: "https://flagcdn.com/w80/cl.png",
        id: "team-chl",
        is_tbd: false,
        name: "Chile",
      },
    },
    {
      group_letter: "C" as const,
      is_final: false,
      position: 1,
      qualification_status: "QUALIFIED_FIRST" as const,
      team: {
        code: "ESP",
        flag_url: "https://flagcdn.com/w80/es.png",
        id: "team-esp",
        is_tbd: false,
        name: "Spain",
      },
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
      code: "USA",
      id: "team-usa",
      name: "United States",
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
