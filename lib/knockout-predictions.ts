import type {
  KnockoutRoundPhase,
  WinnerSide,
} from "@/lib/types/worldcup";

export type KnockoutPredictionWarningState = "NONE" | "STALE_UNRESOLVED";

export interface CanonicalKnockoutPredictionMatchRow {
  away_team_id: string | null;
  home_team_id: string | null;
  id: string;
  match_number: number;
  phase: KnockoutRoundPhase;
}

export interface CanonicalKnockoutPredictionRow {
  confirmed_at?: string | null;
  is_random?: boolean;
  match_id: string;
  provenance?: string | null;
  provenance_note?: string | null;
  predicted_winner_slot: WinnerSide | null;
  predicted_winner_team_id: string | null;
  updated_at?: string | null;
  user_id?: string | null;
}

export interface CanonicalKnockoutPrediction {
  canonicalMatchId: string;
  canonicalMatchNumber: number;
  currentWinnerSlot: WinnerSide | null;
  isRandom: boolean;
  predictionConfirmedAt: string | null;
  predictionProvenance: string | null;
  predictionProvenanceNote: string | null;
  predictedWinnerSlot: WinnerSide | null;
  predictedWinnerTeamId: string | null;
  sourceMatchId: string;
  sourceMatchNumber: number | null;
  updatedAt: string | null;
  userId: string | null;
  warningState: KnockoutPredictionWarningState;
}

export type CanonicalKnockoutPredictionMap = Map<
  string,
  CanonicalKnockoutPrediction
>;

export interface KnockoutPredictionRemapResult {
  predictionsByMatchId: CanonicalKnockoutPredictionMap;
  predictionsByMatchNumber: Map<number, CanonicalKnockoutPrediction>;
}

interface TeamLocation {
  matchId: string;
  matchNumber: number;
  slot: WinnerSide;
}

function toTimestamp(updatedAt: string | null | undefined) {
  if (!updatedAt) {
    return 0;
  }

  const value = new Date(updatedAt).getTime();
  return Number.isFinite(value) ? value : 0;
}

function buildTeamLocationsByPhase(
  matches: CanonicalKnockoutPredictionMatchRow[],
) {
  const locationsByPhase = new Map<
    KnockoutRoundPhase,
    Map<string, TeamLocation[]>
  >();

  for (const match of matches) {
    const phaseMap =
      locationsByPhase.get(match.phase) ?? new Map<string, TeamLocation[]>();

    const slotEntries: Array<[string | null, WinnerSide]> = [
      [match.home_team_id, "HOME"],
      [match.away_team_id, "AWAY"],
    ];

    for (const [teamId, slot] of slotEntries) {
      if (!teamId) {
        continue;
      }

      const currentLocations = phaseMap.get(teamId) ?? [];
      currentLocations.push({
        matchId: match.id,
        matchNumber: match.match_number,
        slot,
      });
      phaseMap.set(teamId, currentLocations);
    }

    locationsByPhase.set(match.phase, phaseMap);
  }

  return locationsByPhase;
}

function resolveTeamLocation(input: {
  phase: KnockoutRoundPhase;
  prediction: CanonicalKnockoutPredictionRow;
  sourceMatchId: string;
  teamLocationsByPhase: Map<KnockoutRoundPhase, Map<string, TeamLocation[]>>;
  userId?: string;
}) {
  const teamId = input.prediction.predicted_winner_team_id;

  if (!teamId) {
    return null;
  }

  const locations =
    input.teamLocationsByPhase.get(input.phase)?.get(teamId) ?? [];

  if (locations.length <= 1) {
    return locations[0] ?? null;
  }

  const sourceLocation =
    locations.find((location) => location.matchId === input.sourceMatchId) ??
    null;

  if (sourceLocation) {
    return sourceLocation;
  }

  console.warn("[knockout-predictions] Duplicate team locations in same phase", {
    matchId: input.prediction.match_id,
    sourceMatch: input.sourceMatchId,
    teamId,
    userId: input.prediction.user_id ?? input.userId ?? null,
  });

  return null;
}

function chooseCollisionWinner(
  left: CanonicalKnockoutPrediction,
  right: CanonicalKnockoutPrediction,
) {
  const leftExact = left.sourceMatchId === left.canonicalMatchId ? 1 : 0;
  const rightExact = right.sourceMatchId === right.canonicalMatchId ? 1 : 0;

  if (leftExact !== rightExact) {
    return leftExact > rightExact ? left : right;
  }

  if (toTimestamp(left.updatedAt) !== toTimestamp(right.updatedAt)) {
    return toTimestamp(left.updatedAt) > toTimestamp(right.updatedAt)
      ? left
      : right;
  }

  if ((left.sourceMatchNumber ?? Number.MAX_SAFE_INTEGER) !== (right.sourceMatchNumber ?? Number.MAX_SAFE_INTEGER)) {
    return (left.sourceMatchNumber ?? Number.MAX_SAFE_INTEGER) <
      (right.sourceMatchNumber ?? Number.MAX_SAFE_INTEGER)
      ? left
      : right;
  }

  return left.sourceMatchId.localeCompare(right.sourceMatchId) <= 0
    ? left
    : right;
}

export function buildCanonicalKnockoutPredictionMap(input: {
  matches: CanonicalKnockoutPredictionMatchRow[];
  predictions: CanonicalKnockoutPredictionRow[];
  userId?: string;
}): KnockoutPredictionRemapResult {
  const matchesById = new Map(
    input.matches.map((match) => [match.id, match] as const),
  );
  const teamLocationsByPhase = buildTeamLocationsByPhase(input.matches);
  const candidatesByCanonicalMatchId = new Map<
    string,
    CanonicalKnockoutPrediction[]
  >();

  for (const prediction of input.predictions) {
    const sourceMatch = matchesById.get(prediction.match_id) ?? null;

    if (!sourceMatch) {
      console.warn("[knockout-predictions] Prediction references missing match", {
        sourceMatch: prediction.match_id,
        teamId: prediction.predicted_winner_team_id,
        userId: prediction.user_id ?? input.userId ?? null,
      });
      continue;
    }

    const resolvedLocation = resolveTeamLocation({
      phase: sourceMatch.phase,
      prediction,
      sourceMatchId: sourceMatch.id,
      teamLocationsByPhase,
      userId: input.userId,
    });
    const warningState: KnockoutPredictionWarningState =
      prediction.predicted_winner_team_id && !resolvedLocation
        ? "STALE_UNRESOLVED"
        : "NONE";
    const canonicalPrediction: CanonicalKnockoutPrediction = {
      canonicalMatchId: resolvedLocation?.matchId ?? sourceMatch.id,
      canonicalMatchNumber: resolvedLocation?.matchNumber ?? sourceMatch.match_number,
      currentWinnerSlot:
        resolvedLocation?.slot ??
        (prediction.predicted_winner_team_id
          ? null
          : prediction.predicted_winner_slot),
      isRandom: prediction.is_random ?? false,
      predictionConfirmedAt: prediction.confirmed_at ?? null,
      predictionProvenance: prediction.provenance ?? null,
      predictionProvenanceNote: prediction.provenance_note ?? null,
      predictedWinnerSlot:
        resolvedLocation?.slot ?? prediction.predicted_winner_slot,
      predictedWinnerTeamId: prediction.predicted_winner_team_id,
      sourceMatchId: sourceMatch.id,
      sourceMatchNumber: sourceMatch.match_number,
      updatedAt: prediction.updated_at ?? null,
      userId: prediction.user_id ?? input.userId ?? null,
      warningState,
    };
    const currentCandidates =
      candidatesByCanonicalMatchId.get(canonicalPrediction.canonicalMatchId) ??
      [];

    currentCandidates.push(canonicalPrediction);
    candidatesByCanonicalMatchId.set(
      canonicalPrediction.canonicalMatchId,
      currentCandidates,
    );
  }

  const predictionsByMatchId: CanonicalKnockoutPredictionMap = new Map();
  const predictionsByMatchNumber = new Map<number, CanonicalKnockoutPrediction>();

  for (const [canonicalMatchId, candidates] of candidatesByCanonicalMatchId) {
    const winner = candidates.reduce((currentWinner, candidate) =>
      chooseCollisionWinner(currentWinner, candidate),
    );

    predictionsByMatchId.set(canonicalMatchId, winner);
    predictionsByMatchNumber.set(winner.canonicalMatchNumber, winner);

    for (const candidate of candidates) {
      if (candidate === winner) {
        continue;
      }

      console.warn("[knockout-predictions] Canonical prediction collision", {
        sourceMatch: candidate.sourceMatchId,
        targetMatch: canonicalMatchId,
        teamId: candidate.predictedWinnerTeamId,
        userId: candidate.userId,
        winnerSourceMatch: winner.sourceMatchId,
      });
    }
  }

  return {
    predictionsByMatchId,
    predictionsByMatchNumber,
  };
}
