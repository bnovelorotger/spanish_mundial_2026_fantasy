import { describe, expect, it } from "vitest";

import {
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

    expect(result.error).toBe("Each team can only appear once in the group order.");
  });

  it("rejects a submission with fewer than four teams", () => {
    const result = validateGroupPredictionInput({
      availableTeamIds,
      groupLetter: "A",
      isLocked: false,
      teamIds: ["team-1", "team-2", "team-3"],
    });

    expect(result.error).toBe(
      "Every group prediction must contain exactly 4 teams.",
    );
  });

  it("rejects teams that do not belong to the selected group", () => {
    const result = validateGroupPredictionInput({
      availableTeamIds,
      groupLetter: "A",
      isLocked: false,
      teamIds: ["team-1", "team-2", "team-3", "outsider"],
    });

    expect(result.error).toBe("One or more teams do not belong to that group.");
  });

  it("rejects saves when the phase is locked", () => {
    const result = validateGroupPredictionInput({
      availableTeamIds,
      groupLetter: "A",
      isLocked: true,
      teamIds: ["team-1", "team-2", "team-3", "team-4"],
    });

    expect(result.error).toBe(
      "Group stage locked. Picks are no longer editable.",
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
