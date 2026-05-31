import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  GroupLetter,
  PointsBreakdown,
  PointsSourceType,
  QualificationStatus,
} from "../types/worldcup";

interface StandingRow {
  group_letter: GroupLetter;
  position: number;
  qualification_status: QualificationStatus | null;
  team_id: string;
}

interface GroupPredictionRow {
  group_letter: GroupLetter;
  predicted_position: number;
  team_id: string;
  user_id: string;
}

interface PointsRow {
  created_at?: string;
  metadata: Record<string, unknown> | null;
  points_awarded: number;
  reason: string | null;
  source_id: string;
  source_type: PointsSourceType;
  user_id: string;
}

interface GroupPredictionScoreInput {
  actualPosition: number;
  groupLetter: GroupLetter;
  predictedPosition: number;
  qualificationStatus: QualificationStatus | null;
  teamId: string;
}

export interface GroupPredictionScoreResult {
  metadata: Record<string, unknown>;
  pointsAwarded: number;
  reason: string;
  sourceId: string;
}

function buildGroupPointSourceId(groupLetter: GroupLetter, teamId: string) {
  return `group_${groupLetter}_team_${teamId}`;
}

function buildStamp(pointsAwarded: number, reason: string) {
  if (reason === "Exact position") {
    return "Exact";
  }

  if (pointsAwarded === 0) {
    return "Miss";
  }

  return `${pointsAwarded === 1 ? "+1 pt" : `+${pointsAwarded} pts`}`;
}

function eligibleGroupsFromStandings(standings: StandingRow[]) {
  const groups = new Map<GroupLetter, StandingRow[]>();

  for (const standing of standings) {
    const currentRows = groups.get(standing.group_letter) ?? [];
    currentRows.push(standing);
    groups.set(standing.group_letter, currentRows);
  }

  return new Set(
    [...groups.entries()]
      .filter(([, rows]) => rows.length === 4)
      .map(([groupLetter]) => groupLetter),
  );
}

export function scoreGroupPrediction(
  input: GroupPredictionScoreInput,
): GroupPredictionScoreResult {
  let pointsAwarded = 0;
  let reason = "Miss";

  if (
    input.predictedPosition === 3 &&
    input.actualPosition === 3 &&
    input.qualificationStatus === "BEST_THIRD"
  ) {
    pointsAwarded = 2;
    reason = "Best third bonus";
  } else if (input.predictedPosition === input.actualPosition) {
    pointsAwarded = 3;
    reason = "Exact position";
  } else if (input.predictedPosition <= 2 && input.actualPosition <= 2) {
    pointsAwarded = 1;
    reason = "Top 2, wrong position";
  }

  return {
    metadata: {
      actualPosition: input.actualPosition,
      groupLetter: input.groupLetter,
      predictedPosition: input.predictedPosition,
      qualificationStatus: input.qualificationStatus,
      stamp: buildStamp(pointsAwarded, reason),
      teamId: input.teamId,
    },
    pointsAwarded,
    reason,
    sourceId: buildGroupPointSourceId(input.groupLetter, input.teamId),
  };
}

export function buildGroupStagePointsRows(
  predictions: GroupPredictionRow[],
  currentStandings: StandingRow[],
): PointsRow[] {
  const eligibleGroups = eligibleGroupsFromStandings(currentStandings);
  const standingsByGroupAndTeam = new Map<string, StandingRow>();

  for (const standing of currentStandings) {
    standingsByGroupAndTeam.set(
      `${standing.group_letter}:${standing.team_id}`,
      standing,
    );
  }

  return predictions
    .filter((prediction) => eligibleGroups.has(prediction.group_letter))
    .reduce<PointsRow[]>((rows, prediction) => {
      const standing = standingsByGroupAndTeam.get(
        `${prediction.group_letter}:${prediction.team_id}`,
      );

      if (!standing) {
        return rows;
      }

      const scored = scoreGroupPrediction({
        actualPosition: standing.position,
        groupLetter: prediction.group_letter,
        predictedPosition: prediction.predicted_position,
        qualificationStatus: standing.qualification_status,
        teamId: prediction.team_id,
      });

      rows.push({
        metadata: scored.metadata,
        points_awarded: scored.pointsAwarded,
        reason: scored.reason,
        source_id: scored.sourceId,
        source_type: "GROUP_POSITION" as const,
        user_id: prediction.user_id,
      });

      return rows;
    }, [])
    .sort((left, right) => left.source_id.localeCompare(right.source_id));
}

async function loadGroupStageScoringInputs(supabase: SupabaseClient) {
  const [predictionsResponse, standingsResponse] = await Promise.all([
    supabase
      .from("group_predictions")
      .select("user_id, group_letter, team_id, predicted_position"),
    supabase
      .from("group_standings")
      .select("group_letter, team_id, position, qualification_status"),
  ]);

  if (predictionsResponse.error) {
    throw new Error(
      `Could not load group predictions for scoring: ${predictionsResponse.error.message}`,
    );
  }

  if (standingsResponse.error) {
    throw new Error(
      `Could not load current standings for scoring: ${standingsResponse.error.message}`,
    );
  }

  return {
    currentStandings: standingsResponse.data as StandingRow[],
    predictions: predictionsResponse.data as GroupPredictionRow[],
  };
}

export async function recalculateAllPoints(
  supabase?: SupabaseClient,
) {
  const client =
    supabase ??
    (await import("../supabase/admin.ts")).createAdminClient();
  const { currentStandings, predictions } = await loadGroupStageScoringInputs(
    client,
  );
  const groupRows = buildGroupStagePointsRows(predictions, currentStandings);

  const deleteResponse = await client
    .from("points")
    .delete()
    .eq("source_type", "GROUP_POSITION");

  if (deleteResponse.error) {
    throw new Error(
      `Could not clear existing group points: ${deleteResponse.error.message}`,
    );
  }

  if (groupRows.length > 0) {
    const insertResponse = await client.from("points").insert(groupRows);

    if (insertResponse.error) {
      throw new Error(
        `Could not save recalculated points: ${insertResponse.error.message}`,
      );
    }
  }

  const awardedTotal = groupRows.reduce(
    (total, row) => total + row.points_awarded,
    0,
  );

  return {
    awardedTotal,
    rowsScored: groupRows.length,
    sourceType: "GROUP_POSITION" as const,
  };
}

export function getPointsBreakdownFromRows(rows: PointsRow[]): PointsBreakdown {
  const groupStage = rows
    .filter((row) => row.source_type === "GROUP_POSITION")
    .reduce((total, row) => total + row.points_awarded, 0);
  const knockout = rows
    .filter((row) => row.source_type === "KNOCKOUT_WINNER")
    .reduce((total, row) => total + row.points_awarded, 0);
  const champion = rows
    .filter((row) => row.source_type === "CHAMPION")
    .reduce((total, row) => total + row.points_awarded, 0);

  return {
    champion,
    details: rows.map((row) => ({
      metadata: row.metadata,
      pointsAwarded: row.points_awarded,
      reason: row.reason,
      sourceId: row.source_id,
      sourceType: row.source_type,
    })),
    groupStage,
    knockout,
    total: groupStage + knockout + champion,
  };
}
