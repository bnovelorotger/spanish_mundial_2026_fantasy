import { describe, expect, it } from "vitest";

import {
  buildGroupStagePointsRows,
  getPointsBreakdownFromRows,
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

  it("returns a miss stamp when the prediction does not score", () => {
    const result = scoreGroupPrediction({
      actualPosition: 4,
      groupLetter: "A",
      predictedPosition: 1,
      qualificationStatus: "ELIMINATED",
      teamId: "team-a",
    });

    expect(result.pointsAwarded).toBe(0);
    expect(result.reason).toBe("Miss");
    expect(result.metadata.stamp).toBe("Miss");
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

  it("keeps deterministic rows, including misses, sorted by source id", () => {
    const mixedRows = buildGroupStagePointsRows(
      [
        predictions[3]!,
        predictions[1]!,
        predictions[0]!,
        predictions[2]!,
      ],
      finalStandings.map((standing) =>
        standing.team_id === "team-4"
          ? { ...standing, position: 1, qualification_status: "QUALIFIED_FIRST" as const }
          : standing,
      ),
    );

    expect(mixedRows).toHaveLength(4);
    expect(mixedRows[0]?.source_id).toBe("group_A_team_team-1");
    expect(mixedRows[3]?.source_id).toBe("group_A_team_team-4");
    expect(
      mixedRows.find((row) => row.source_id === "group_A_team_team-4")?.metadata?.stamp,
    ).toBe("Miss");
    expect(mixedRows.some((row) => row.points_awarded === 0)).toBe(true);
  });
});

describe("getPointsBreakdownFromRows", () => {
  it("aggregates totals by scoring source", () => {
    const breakdown = getPointsBreakdownFromRows([
      {
        created_at: "2026-06-12T00:00:00Z",
        metadata: { stamp: "Exact" },
        points_awarded: 3,
        reason: "Exact position",
        source_id: "group_A_team_team-1",
        source_type: "GROUP_POSITION",
        user_id: "user-1",
      },
      {
        created_at: "2026-07-12T00:00:00Z",
        metadata: null,
        points_awarded: 4,
        reason: "Quarter-final",
        source_id: "match-1",
        source_type: "KNOCKOUT_WINNER",
        user_id: "user-1",
      },
      {
        created_at: "2026-07-19T00:00:00Z",
        metadata: null,
        points_awarded: 6,
        reason: "Champion",
        source_id: "champion-1",
        source_type: "CHAMPION",
        user_id: "user-1",
      },
    ]);

    expect(breakdown.groupStage).toBe(3);
    expect(breakdown.knockout).toBe(4);
    expect(breakdown.champion).toBe(6);
    expect(breakdown.total).toBe(13);
    expect(breakdown.details).toHaveLength(3);
  });
});
