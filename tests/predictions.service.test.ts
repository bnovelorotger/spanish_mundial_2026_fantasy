import { describe, expect, it } from "vitest";

import {
  mapGroupTeams,
  parseGroupPredictionFormData,
  validateGroupPredictionInput,
} from "@/lib/services/predictions.service";

describe("parseGroupPredictionFormData", () => {
  it("extracts a group letter and ordered team ids from the form payload", () => {
    const formData = new FormData();

    formData.set("group_letter", "A");
    formData.append("team_ids", "team-1");
    formData.append("team_ids", "team-2");
    formData.append("team_ids", "team-3");
    formData.append("team_ids", "team-4");

    const parsed = parseGroupPredictionFormData(formData);

    expect(parsed.data).toEqual({
      groupLetter: "A",
      teamIds: ["team-1", "team-2", "team-3", "team-4"],
    });
  });
});

describe("validateGroupPredictionInput", () => {
  const availableTeamIds = ["team-1", "team-2", "team-3", "team-4"];

  it("rejects duplicate teams", () => {
    const result = validateGroupPredictionInput({
      availableTeamIds,
      groupLetter: "A",
      isLocked: false,
      teamIds: ["team-1", "team-1", "team-3", "team-4"],
    });

    expect(result.error).toBe("Cada equipo solo puede aparecer una vez en el orden del grupo.");
  });

  it("rejects a submission with fewer than four teams", () => {
    const result = validateGroupPredictionInput({
      availableTeamIds,
      groupLetter: "A",
      isLocked: false,
      teamIds: ["team-1", "team-2", "team-3"],
    });

    expect(result.error).toBe(
      "Cada grupo debe incluir exactamente 4 equipos.",
    );
  });

  it("rejects teams that do not belong to the selected group", () => {
    const result = validateGroupPredictionInput({
      availableTeamIds,
      groupLetter: "A",
      isLocked: false,
      teamIds: ["team-1", "team-2", "team-3", "outsider"],
    });

    expect(result.error).toBe("Uno o más equipos no pertenecen a ese grupo.");
  });

  it("rejects saves when the phase is locked", () => {
    const result = validateGroupPredictionInput({
      availableTeamIds,
      groupLetter: "A",
      isLocked: true,
      teamIds: ["team-1", "team-2", "team-3", "team-4"],
    });

    expect(result.error).toBe(
      "La fase de grupos ya está cerrada. Ya no puedes editar este pronóstico.",
    );
  });

  it("accepts a valid four-team group order", () => {
    const result = validateGroupPredictionInput({
      availableTeamIds,
      groupLetter: "A",
      isLocked: false,
      teamIds: ["team-1", "team-2", "team-3", "team-4"],
    });

    expect(result.data).toEqual({
      groupLetter: "A",
      teamIds: ["team-1", "team-2", "team-3", "team-4"],
    });
  });
});

describe("mapGroupTeams", () => {
  const teams = [
    {
      code: "ESP",
      flag_url: null,
      group_letter: "H" as const,
      id: "team-esp",
      is_tbd: false,
      name: "Spain",
    },
    {
      code: "URY",
      flag_url: null,
      group_letter: "H" as const,
      id: "team-ury",
      is_tbd: false,
      name: "Uruguay",
    },
    {
      code: "CPV",
      flag_url: null,
      group_letter: "H" as const,
      id: "team-cpv",
      is_tbd: false,
      name: "Cape Verde",
    },
    {
      code: "KSA",
      flag_url: null,
      group_letter: "H" as const,
      id: "team-ksa",
      is_tbd: false,
      name: "Saudi Arabia",
    },
  ];

  it("keeps partial saved rows in their positions and fills only missing slots", () => {
    const mapped = mapGroupTeams("H", teams, [
      {
        confirmed_at: "2026-06-14T20:00:00Z",
        group_letter: "H",
        predicted_position: 1,
        provenance: "MANUAL_REVIEWED",
        provenance_note: "Recovered",
        team_id: "team-esp",
      },
      {
        confirmed_at: null,
        group_letter: "H",
        predicted_position: 3,
        provenance: "INFERRED_100",
        provenance_note: null,
        team_id: "team-cpv",
      },
    ]);

    expect(mapped.savedCount).toBe(2);
    expect(mapped.teams.map((team) => `${team.predictedPosition}:${team.code}`)).toEqual([
      "1:ESP",
      "2:KSA",
      "3:CPV",
      "4:URY",
    ]);
    expect(mapped.teams[0]?.provenance).toBe("MANUAL_REVIEWED");
    expect(mapped.teams[2]?.provenance).toBe("INFERRED_100");
  });

  it("keeps a complete user-submitted group unchanged", () => {
    const mapped = mapGroupTeams(
      "H",
      teams,
      ["team-ury", "team-esp", "team-ksa", "team-cpv"].map((teamId, index) => ({
        confirmed_at: "2026-06-14T20:00:00Z",
        group_letter: "H" as const,
        predicted_position: index + 1,
        provenance: "USER_SUBMITTED" as const,
        provenance_note: null,
        team_id: teamId,
      })),
    );

    expect(mapped.savedCount).toBe(4);
    expect(mapped.teams.map((team) => team.code)).toEqual([
      "URY",
      "ESP",
      "KSA",
      "CPV",
    ]);
    expect(mapped.teams.every((team) => team.provenance === "USER_SUBMITTED")).toBe(true);
  });
});
