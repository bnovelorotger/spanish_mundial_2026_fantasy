import { describe, expect, it } from "vitest";

import {
  buildGroupStagePointsRows,
  buildKnockoutPointsRows,
  getPointsBreakdownFromRows,
  scoreGroupPrediction,
  scoreKnockoutPrediction,
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
      confirmed_at: "2026-06-14T20:00:00Z",
      group_letter: "A" as const,
      predicted_position: 1,
      provenance: "USER_SUBMITTED" as const,
      provenance_note: null,
      team_id: "team-1",
      user_id: "user-1",
    },
    {
      confirmed_at: "2026-06-14T20:00:00Z",
      group_letter: "A" as const,
      predicted_position: 2,
      provenance: "USER_SUBMITTED" as const,
      provenance_note: null,
      team_id: "team-2",
      user_id: "user-1",
    },
    {
      confirmed_at: "2026-06-14T20:00:00Z",
      group_letter: "A" as const,
      predicted_position: 3,
      provenance: "USER_SUBMITTED" as const,
      provenance_note: null,
      team_id: "team-3",
      user_id: "user-1",
    },
    {
      confirmed_at: "2026-06-14T20:00:00Z",
      group_letter: "A" as const,
      predicted_position: 4,
      provenance: "USER_SUBMITTED" as const,
      provenance_note: null,
      team_id: "team-4",
      user_id: "user-1",
    },
  ];

  const currentStandings = [
    {
      group_letter: "A" as const,
      played: 1,
      position: 1,
      qualification_status: "QUALIFIED_FIRST" as const,
      team_id: "team-1",
    },
    {
      group_letter: "A" as const,
      played: 1,
      position: 2,
      qualification_status: "QUALIFIED_SECOND" as const,
      team_id: "team-2",
    },
    {
      group_letter: "A" as const,
      played: 1,
      position: 3,
      qualification_status: "BEST_THIRD" as const,
      team_id: "team-3",
    },
    {
      group_letter: "A" as const,
      played: 1,
      position: 4,
      qualification_status: "ELIMINATED" as const,
      team_id: "team-4",
    },
  ];

  it("is idempotent for the same predictions and current standings", () => {
    const firstPass = buildGroupStagePointsRows(predictions, currentStandings);
    const secondPass = buildGroupStagePointsRows(predictions, currentStandings);

    expect(firstPass).toEqual(secondPass);
  });

  it("does not score groups without four current standings", () => {
    const partialStandings = currentStandings.slice(0, 3);

    expect(buildGroupStagePointsRows(predictions, partialStandings)).toEqual([]);
  });

  it("does not score seeded standings before a group has played", () => {
    const unplayedStandings = currentStandings.map((standing) => ({
      ...standing,
      played: 0,
    }));

    expect(buildGroupStagePointsRows(predictions, unplayedStandings)).toEqual([]);
  });

  it("scores current standings that are not final yet", () => {
    const liveStandings = currentStandings.map((standing) => ({
      ...standing,
      is_final: false,
    }));

    const rows = buildGroupStagePointsRows(predictions, liveStandings);

    expect(
      rows.find((row) => row.source_id === "group_A_team_team-1")
        ?.points_awarded,
    ).toBe(3);
  });

  it("keeps a third-place exact hit at 3 points until best-third qualification is known", () => {
    const liveStandings = currentStandings.map((standing) =>
      standing.team_id === "team-3"
        ? { ...standing, qualification_status: null }
        : standing,
    );

    const rows = buildGroupStagePointsRows(predictions, liveStandings);
    const thirdPlaceRow = rows.find(
      (row) => row.source_id === "group_A_team_team-3",
    );

    expect(thirdPlaceRow?.points_awarded).toBe(3);
    expect(thirdPlaceRow?.reason).toBe("Exact position");
    expect(thirdPlaceRow?.metadata?.stamp).toBe("Exact");
  });

  it("keeps deterministic rows, including misses, sorted by source id", () => {
    const mixedRows = buildGroupStagePointsRows(
      [
        predictions[3]!,
        predictions[1]!,
        predictions[0]!,
        predictions[2]!,
      ],
      currentStandings.map((standing) =>
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

  it("keeps scoring reconstructed baseline predictions while tagging metadata", () => {
    const rows = buildGroupStagePointsRows(
      [
        {
          ...predictions[0]!,
          provenance: "BASELINE",
          provenance_note: "Alphabetical baseline",
        },
      ],
      currentStandings,
    );

    expect(rows[0]?.points_awarded).toBe(3);
    expect(rows[0]?.metadata?.predictionProvenance).toBe("BASELINE");
    expect(rows[0]?.metadata?.predictionProvenanceNote).toBe("Alphabetical baseline");
    expect(rows[0]?.metadata?.predictionConfirmedAt).toBe("2026-06-14T20:00:00Z");
  });
});

describe("scoreKnockoutPrediction", () => {
  it("awards the configured round points when the winner side matches", () => {
    const result = scoreKnockoutPrediction({
      matchId: "match-final",
      phase: "FINAL",
      predictedWinnerSlot: "HOME",
      winnerSide: "HOME",
    });

    expect(result.pointsAwarded).toBe(25);
    expect(result.reason).toBe("Correct winner · Final");
    expect(result.metadata.stamp).toBe("+25 pts");
  });

  it("returns a miss when the selected side does not advance", () => {
    const result = scoreKnockoutPrediction({
      matchId: "match-semi",
      phase: "SEMI_FINALS",
      predictedWinnerSlot: "HOME",
      winnerSide: "AWAY",
    });

    expect(result.pointsAwarded).toBe(0);
    expect(result.reason).toBe("Miss");
    expect(result.metadata.stamp).toBe("Miss");
  });
});

describe("buildKnockoutPointsRows", () => {
  it("creates deterministic rows for knockout hits, misses and champion bonus", () => {
    const rows = buildKnockoutPointsRows(
      [
        {
          confirmed_at: "2026-07-01T12:00:00Z",
          match_id: "match-r32",
          predicted_winner_slot: "HOME",
          provenance: "USER_SUBMITTED",
          provenance_note: null,
          user_id: "user-1",
        },
        {
          confirmed_at: "2026-07-19T12:00:00Z",
          match_id: "match-final",
          predicted_winner_slot: "AWAY",
          provenance: "USER_SUBMITTED",
          provenance_note: null,
          user_id: "user-1",
        },
      ],
      [
        {
          id: "match-r32",
          phase: "ROUND_OF_32",
          status: "FINISHED",
          winner_side: "HOME",
        },
        {
          id: "match-final",
          phase: "FINAL",
          status: "FINISHED",
          winner_side: "HOME",
        },
      ],
    );

    expect(rows).toHaveLength(3);
    expect(rows.map((row) => row.source_id)).toEqual([
      "knockout_match_match-final",
      "knockout_match_match-r32",
      "champion_final_match-final",
    ]);
    expect(
      rows.find((row) => row.source_id === "knockout_match_match-r32"),
    ).toMatchObject({
      points_awarded: 4,
      source_type: "KNOCKOUT_WINNER",
    });
    expect(
      rows.find((row) => row.source_id === "knockout_match_match-final"),
    ).toMatchObject({
      points_awarded: 0,
      source_type: "KNOCKOUT_WINNER",
    });
    expect(
      rows.find((row) => row.source_id === "champion_final_match-final"),
    ).toMatchObject({
      points_awarded: 0,
      source_type: "CHAMPION",
    });
  });

  it("skips finished matches that still have no resolvable winner side", () => {
    const rows = buildKnockoutPointsRows(
      [
        {
          confirmed_at: "2026-07-01T12:00:00Z",
          match_id: "match-r32",
          predicted_winner_slot: "HOME",
          provenance: "USER_SUBMITTED",
          provenance_note: null,
          user_id: "user-1",
        },
      ],
      [
        {
          id: "match-r32",
          phase: "ROUND_OF_32",
          status: "FINISHED",
          winner_side: null,
        },
      ],
    );

    expect(rows).toEqual([]);
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
        points_awarded: 25,
        reason: "Champion",
        source_id: "champion-1",
        source_type: "CHAMPION",
        user_id: "user-1",
      },
    ]);

    expect(breakdown.groupStage).toBe(3);
    expect(breakdown.knockout).toBe(4);
    expect(breakdown.champion).toBe(25);
    expect(breakdown.total).toBe(32);
    expect(breakdown.details).toHaveLength(3);
  });
});
