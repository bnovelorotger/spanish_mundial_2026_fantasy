import { describe, expect, it } from "vitest";

import {
  buildGroupStagePointsRows,
  scoreGroupPrediction,
} from "@/lib/services/scoring.service";

describe("scoreGroupPrediction", () => {
  it("awards 3 points for an exact position", () => {
    const result = scoreGroupPrediction({
      actualPosition: 1,
      groupLetter: "A",
      predictedPosition: 1,
      qualificationStatus: "QUALIFIED_FIRST",
      teamId: "team-a",
    });

    expect(result.pointsAwarded).toBe(3);
    expect(result.reason).toBe("Exact position");
  });

  it("awards 1 point for a top-2 finish in the wrong order", () => {
    const result = scoreGroupPrediction({
      actualPosition: 2,
      groupLetter: "A",
      predictedPosition: 1,
      qualificationStatus: "QUALIFIED_SECOND",
      teamId: "team-a",
    });

    expect(result.pointsAwarded).toBe(1);
    expect(result.reason).toBe("Top 2, wrong position");
  });

  it("awards 2 points for a predicted third-place best third qualifier", () => {
    const result = scoreGroupPrediction({
      actualPosition: 3,
      groupLetter: "A",
      predictedPosition: 3,
      qualificationStatus: "BEST_THIRD",
      teamId: "team-a",
    });

    expect(result.pointsAwarded).toBe(2);
    expect(result.reason).toBe("Best third bonus");
  });
});

describe("buildGroupStagePointsRows", () => {
  const predictions = [
    {
      group_letter: "A" as const,
      predicted_position: 1,
      team_id: "team-1",
      user_id: "user-1",
    },
    {
      group_letter: "A" as const,
      predicted_position: 2,
      team_id: "team-2",
      user_id: "user-1",
    },
    {
      group_letter: "A" as const,
      predicted_position: 3,
      team_id: "team-3",
      user_id: "user-1",
    },
    {
      group_letter: "A" as const,
      predicted_position: 4,
      team_id: "team-4",
      user_id: "user-1",
    },
  ];

  const finalStandings = [
    {
      group_letter: "A" as const,
      position: 1,
      qualification_status: "QUALIFIED_FIRST" as const,
      team_id: "team-1",
    },
    {
      group_letter: "A" as const,
      position: 2,
      qualification_status: "QUALIFIED_SECOND" as const,
      team_id: "team-2",
    },
    {
      group_letter: "A" as const,
      position: 3,
      qualification_status: "BEST_THIRD" as const,
      team_id: "team-3",
    },
    {
      group_letter: "A" as const,
      position: 4,
      qualification_status: "ELIMINATED" as const,
      team_id: "team-4",
    },
  ];

  it("is idempotent for the same predictions and final standings", () => {
    const firstPass = buildGroupStagePointsRows(predictions, finalStandings);
    const secondPass = buildGroupStagePointsRows(predictions, finalStandings);

    expect(firstPass).toEqual(secondPass);
  });

  it("does not score groups without four final standings", () => {
    const partialStandings = finalStandings.slice(0, 3);

    expect(buildGroupStagePointsRows(predictions, partialStandings)).toEqual([]);
  });
});
