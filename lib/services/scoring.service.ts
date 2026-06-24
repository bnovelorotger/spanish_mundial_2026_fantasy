import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  GroupLetter,
  KnockoutRoundPhase,
  MatchStatus,
  PointsBreakdown,
  PointsSourceType,
  PredictionProvenance,
  QualificationStatus,
  WinnerSide,
} from "../types/worldcup";

interface StandingRow {
  group_letter: GroupLetter;
  played: number;
  position: number;
  qualification_status: QualificationStatus | null;
  team_id: string;
}

interface GroupPredictionRow {
  confirmed_at: string | null;
  group_letter: GroupLetter;
  predicted_position: number;
  provenance: PredictionProvenance;
  provenance_note: string | null;
  team_id: string;
  user_id: string;
}

interface KnockoutMatchRow {
  id: string;
  phase: KnockoutRoundPhase;
  status: MatchStatus;
  winner_side: WinnerSide | null;
}

interface KnockoutPredictionRow {
  confirmed_at: string | null;
  match_id: string;
  predicted_winner_slot: WinnerSide | null;
  provenance: PredictionProvenance;
  provenance_note: string | null;
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
  predictionConfirmedAt?: string | null;
  predictionProvenance?: PredictionProvenance;
  predictionProvenanceNote?: string | null;
  predictedPosition: number;
  qualificationStatus: QualificationStatus | null;
  teamId: string;
}

interface KnockoutPredictionScoreInput {
  matchId: string;
  phase: KnockoutRoundPhase;
  predictionConfirmedAt?: string | null;
  predictionProvenance?: PredictionProvenance;
  predictionProvenanceNote?: string | null;
  predictedWinnerSlot: WinnerSide;
  winnerSide: WinnerSide;
}

export interface GroupPredictionScoreResult {
  metadata: Record<string, unknown>;
  pointsAwarded: number;
  reason: string;
  sourceId: string;
}

const KNOCKOUT_POINTS_BY_PHASE: Record<KnockoutRoundPhase, number> = {
  FINAL: 25,
  QUARTER_FINALS: 8,
  ROUND_OF_16: 6,
  ROUND_OF_32: 4,
  SEMI_FINALS: 15,
};

function buildGroupPointSourceId(groupLetter: GroupLetter, teamId: string) {
  return `group_${groupLetter}_team_${teamId}`;
}

function buildKnockoutPointSourceId(matchId: string) {
  return `knockout_match_${matchId}`;
}

function buildChampionPointSourceId(matchId: string) {
  return `champion_final_${matchId}`;
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
      .filter(
        ([, rows]) =>
          rows.length === 4 && rows.some((standing) => standing.played > 0),
      )
      .map(([groupLetter]) => groupLetter),
  );
}

function knockoutPhaseReason(phase: KnockoutRoundPhase) {
  switch (phase) {
    case "ROUND_OF_32":
      return "Correct winner · Round of 32";
    case "ROUND_OF_16":
      return "Correct winner · Round of 16";
    case "QUARTER_FINALS":
      return "Correct winner · Quarter-finals";
    case "SEMI_FINALS":
      return "Correct winner · Semi-finals";
    case "FINAL":
      return "Correct winner · Final";
  }
}

function pointsRowSortOrder(sourceType: PointsSourceType) {
  if (sourceType === "GROUP_POSITION") {
    return 0;
  }

  if (sourceType === "KNOCKOUT_WINNER") {
    return 1;
  }

  return 2;
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
      predictionConfirmedAt: input.predictionConfirmedAt ?? null,
      predictionProvenance: input.predictionProvenance ?? "USER_SUBMITTED",
      predictionProvenanceNote: input.predictionProvenanceNote ?? null,
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

export function scoreKnockoutPrediction(
  input: KnockoutPredictionScoreInput,
): GroupPredictionScoreResult {
  const pointsAwarded =
    input.predictedWinnerSlot === input.winnerSide
      ? KNOCKOUT_POINTS_BY_PHASE[input.phase]
      : 0;
  const reason =
    pointsAwarded > 0 ? knockoutPhaseReason(input.phase) : "Miss";

  return {
    metadata: {
      matchId: input.matchId,
      phase: input.phase,
      predictedWinnerSlot: input.predictedWinnerSlot,
      predictionConfirmedAt: input.predictionConfirmedAt ?? null,
      predictionProvenance: input.predictionProvenance ?? "USER_SUBMITTED",
      predictionProvenanceNote: input.predictionProvenanceNote ?? null,
      stamp: buildStamp(pointsAwarded, reason),
      winnerSide: input.winnerSide,
    },
    pointsAwarded,
    reason,
    sourceId: buildKnockoutPointSourceId(input.matchId),
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
        predictionConfirmedAt: prediction.confirmed_at,
        predictionProvenance: prediction.provenance,
        predictionProvenanceNote: prediction.provenance_note,
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

export function buildKnockoutPointsRows(
  predictions: KnockoutPredictionRow[],
  matches: KnockoutMatchRow[],
): PointsRow[] {
  const matchesById = new Map(
    matches
      .filter(
        (match) => match.status === "FINISHED" && match.winner_side !== null,
      )
      .map((match) => [match.id, match] as const),
  );

  const rows = predictions.reduce<PointsRow[]>((currentRows, prediction) => {
    if (!prediction.predicted_winner_slot) {
      return currentRows;
    }

    const match = matchesById.get(prediction.match_id);

    if (!match?.winner_side) {
      return currentRows;
    }

    const scored = scoreKnockoutPrediction({
      matchId: match.id,
      phase: match.phase,
      predictionConfirmedAt: prediction.confirmed_at,
      predictionProvenance: prediction.provenance,
      predictionProvenanceNote: prediction.provenance_note,
      predictedWinnerSlot: prediction.predicted_winner_slot,
      winnerSide: match.winner_side,
    });

    currentRows.push({
      metadata: scored.metadata,
      points_awarded: scored.pointsAwarded,
      reason: scored.reason,
      source_id: scored.sourceId,
      source_type: "KNOCKOUT_WINNER" as const,
      user_id: prediction.user_id,
    });

    if (match.phase === "FINAL") {
      const championPointsAwarded =
        prediction.predicted_winner_slot === match.winner_side ? 25 : 0;
      const championReason =
        championPointsAwarded > 0 ? "Champion bonus" : "Miss";

      currentRows.push({
        metadata: {
          matchId: match.id,
          phase: match.phase,
          predictedWinnerSlot: prediction.predicted_winner_slot,
          predictionConfirmedAt: prediction.confirmed_at,
          predictionProvenance: prediction.provenance,
          predictionProvenanceNote: prediction.provenance_note,
          stamp: buildStamp(championPointsAwarded, championReason),
          winnerSide: match.winner_side,
        },
        points_awarded: championPointsAwarded,
        reason: championReason,
        source_id: buildChampionPointSourceId(match.id),
        source_type: "CHAMPION" as const,
        user_id: prediction.user_id,
      });
    }

    return currentRows;
  }, []);

  return rows.sort((left, right) => {
    if (pointsRowSortOrder(left.source_type) !== pointsRowSortOrder(right.source_type)) {
      return pointsRowSortOrder(left.source_type) - pointsRowSortOrder(right.source_type);
    }

    if (left.source_id !== right.source_id) {
      return left.source_id.localeCompare(right.source_id);
    }

    return left.user_id.localeCompare(right.user_id);
  });
}

async function loadScoringInputs(supabase: SupabaseClient) {
  const [
    groupPredictionsResponse,
    standingsResponse,
    knockoutPredictionsResponse,
    knockoutMatchesResponse,
  ] = await Promise.all([
    supabase
      .from("group_predictions")
      .select(
        "user_id, group_letter, team_id, predicted_position, provenance, provenance_note, confirmed_at",
      ),
    supabase
      .from("group_standings")
      .select("group_letter, team_id, played, position, qualification_status"),
    supabase
      .from("knockout_predictions")
      .select(
        "user_id, match_id, predicted_winner_slot, provenance, provenance_note, confirmed_at",
      ),
    supabase
      .from("matches")
      .select("id, phase, status, winner_side")
      .in("phase", [
        "ROUND_OF_32",
        "ROUND_OF_16",
        "QUARTER_FINALS",
        "SEMI_FINALS",
        "FINAL",
      ]),
  ]);

  if (groupPredictionsResponse.error) {
    throw new Error(
      `Could not load group predictions for scoring: ${groupPredictionsResponse.error.message}`,
    );
  }

  if (standingsResponse.error) {
    throw new Error(
      `Could not load current standings for scoring: ${standingsResponse.error.message}`,
    );
  }

  if (knockoutPredictionsResponse.error) {
    throw new Error(
      `Could not load knockout predictions for scoring: ${knockoutPredictionsResponse.error.message}`,
    );
  }

  if (knockoutMatchesResponse.error) {
    throw new Error(
      `Could not load knockout matches for scoring: ${knockoutMatchesResponse.error.message}`,
    );
  }

  return {
    currentStandings: standingsResponse.data as StandingRow[],
    groupPredictions: groupPredictionsResponse.data as GroupPredictionRow[],
    knockoutMatches: knockoutMatchesResponse.data as KnockoutMatchRow[],
    knockoutPredictions: knockoutPredictionsResponse.data as KnockoutPredictionRow[],
  };
}

export async function recalculateAllPoints(
  supabase?: SupabaseClient,
) {
  const client =
    supabase ??
    (await import("../supabase/admin.ts")).createAdminClient();
  const {
    currentStandings,
    groupPredictions,
    knockoutMatches,
    knockoutPredictions,
  } = await loadScoringInputs(client);
  const groupRows = buildGroupStagePointsRows(groupPredictions, currentStandings);
  const knockoutRows = buildKnockoutPointsRows(knockoutPredictions, knockoutMatches);
  const allRows = [...groupRows, ...knockoutRows];

  const deleteResponse = await client
    .from("points")
    .delete()
    .in("source_type", ["GROUP_POSITION", "KNOCKOUT_WINNER", "CHAMPION"]);

  if (deleteResponse.error) {
    throw new Error(
      `Could not clear existing points: ${deleteResponse.error.message}`,
    );
  }

  if (allRows.length > 0) {
    const insertResponse = await client.from("points").insert(allRows);

    if (insertResponse.error) {
      throw new Error(
        `Could not save recalculated points: ${insertResponse.error.message}`,
      );
    }
  }

  const awardedTotal = allRows.reduce(
    (total, row) => total + row.points_awarded,
    0,
  );

  return {
    awardedTotal,
    rowsScored: allRows.length,
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
