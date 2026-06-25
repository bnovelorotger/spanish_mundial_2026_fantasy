import type { SupabaseClient } from "@supabase/supabase-js";

import { GROUP_LETTER_OPTIONS, type GroupLetter } from "@/lib/types/worldcup";
import type {
  BracketRoundViewModel,
  KnockoutRoundPhase,
  LeagueImpactSummaryViewModel,
  MatchTeamViewModel,
  ParticipantBracketMatchViewModel,
  ParticipantBracketRoundViewModel,
  ParticipantDetailViewModel,
  ParticipantExplorerEntryViewModel,
  ParticipantGroupPredictionViewModel,
  ParticipantPredictionResolutionState,
  PhaseLockViewModel,
  PointsBreakdown,
  PointsSourceType,
  PredictionRevealState,
  QualificationStatus,
  RankingEntry,
  ResultsFeedItemViewModel,
  WinnerSide,
} from "@/lib/types/worldcup";
import { getBracketRounds } from "./bracket.service";
import { getGroupStageLock, getPhaseLock } from "./locks.service";
import {
  getRankingByPhase,
  getUserGapCopy,
  getUserPointsBreakdown,
} from "./ranking.service";

interface TeamRow {
  code: string;
  flag_url: string | null;
  id: string;
  is_tbd: boolean;
  name: string;
}

interface MatchRow {
  away_score: number | null;
  away_team: TeamRow | TeamRow[] | null;
  city: string | null;
  group_letter: GroupLetter | null;
  home_score: number | null;
  home_team: TeamRow | TeamRow[] | null;
  id: string;
  kickoff: string;
  phase: "GROUP_STAGE" | KnockoutRoundPhase;
  status: "FINISHED";
  updated_at: string;
  venue: string | null;
  winner_side: WinnerSide | null;
}

interface GroupStandingRow {
  goal_difference: number;
  group_letter: GroupLetter;
  goals_for: number;
  is_final: boolean;
  points: number;
  position: number;
  qualification_status: QualificationStatus | null;
  team_id: string;
  updated_at: string;
}

interface GroupPredictionRow {
  group_letter: GroupLetter;
  predicted_position: number;
  team_id: string;
}

interface PointRow {
  metadata: Record<string, unknown> | null;
  points_awarded: number;
  source_id: string;
  source_type: PointsSourceType;
  user_id: string;
}

const FINISHED_MATCHES_SELECT = `
  id,
  phase,
  group_letter,
  kickoff,
  status,
  venue,
  city,
  home_score,
  away_score,
  winner_side,
  updated_at,
  home_team:teams!matches_home_team_id_fkey(name, code, flag_url, is_tbd),
  away_team:teams!matches_away_team_id_fkey(name, code, flag_url, is_tbd)
`;

function normalizeTeam(team: TeamRow | TeamRow[] | null): MatchTeamViewModel | null {
  if (!team) {
    return null;
  }

  const value = Array.isArray(team) ? team[0] : team;

  if (!value) {
    return null;
  }

  return {
    code: value.code,
    flagUrl: value.flag_url,
    isTbd: value.is_tbd,
    name: value.name,
  };
}

function normalizeDisplayName(entry: RankingEntry) {
  return entry.displayName?.trim() || entry.username;
}

function metadataString(
  metadata: Record<string, unknown> | null,
  key: string,
): string | null {
  const value = metadata?.[key];
  return typeof value === "string" ? value : null;
}

function metadataNumber(
  metadata: Record<string, unknown> | null,
  key: string,
): number | null {
  const value = metadata?.[key];
  return typeof value === "number" ? value : null;
}

function metadataGroupLetter(
  metadata: Record<string, unknown> | null,
): GroupLetter | null {
  const value = metadataString(metadata, "groupLetter");
  return value && GROUP_LETTER_OPTIONS.includes(value as GroupLetter)
    ? (value as GroupLetter)
    : null;
}

function metadataWinnerSide(
  metadata: Record<string, unknown> | null,
): WinnerSide | null {
  const value = metadataString(metadata, "winnerSide");
  return value === "HOME" || value === "AWAY" ? value : null;
}

function phaseLabel(phase: KnockoutRoundPhase) {
  switch (phase) {
    case "ROUND_OF_32":
      return "Dieciseisavos";
    case "ROUND_OF_16":
      return "Octavos";
    case "QUARTER_FINALS":
      return "Cuartos";
    case "SEMI_FINALS":
      return "Semifinales";
    case "FINAL":
      return "Final";
  }
}

function buildPendingImpactCopy(groupLetter: GroupLetter) {
  return `Sin puntos todavía: el Grupo ${groupLetter} sigue abierto.`;
}

function buildImpactSummary(input: {
  description: string;
  hits: number;
  misses: number;
  pointsAwarded: number;
  sourceType: PointsSourceType;
}): LeagueImpactSummaryViewModel {
  return {
    description: input.description,
    hits: input.hits,
    misses: input.misses,
    pointsAwarded: input.pointsAwarded,
    sourceType: input.sourceType,
  };
}

function buildGroupClosureImpact(
  pointsRows: PointRow[],
  groupLetter: GroupLetter,
): LeagueImpactSummaryViewModel {
  const totalsByUser = new Map<string, number>();

  for (const row of pointsRows) {
    if (
      row.source_type !== "GROUP_POSITION" ||
      metadataGroupLetter(row.metadata) !== groupLetter
    ) {
      continue;
    }

    totalsByUser.set(
      row.user_id,
      (totalsByUser.get(row.user_id) ?? 0) + row.points_awarded,
    );
  }

  const totals = [...totalsByUser.values()];
  const hits = totals.filter((value) => value > 0).length;
  const misses = totals.filter((value) => value === 0).length;
  const pointsAwarded = totals.reduce((total, value) => total + value, 0);

  return buildImpactSummary({
    description:
      totals.length > 0
        ? `${hits} participante${hits === 1 ? "" : "s"} sumaron en este cierre de grupo.`
        : "Aún no hay picks puntuables registrados para este grupo.",
    hits,
    misses,
    pointsAwarded,
    sourceType: "GROUP_POSITION",
  });
}

function buildKnockoutImpact(input: {
  includeChampionBonus: boolean;
  matchId: string;
  pointsRows: PointRow[];
}): LeagueImpactSummaryViewModel {
  const winnerRows = input.pointsRows.filter(
    (row) =>
      row.source_type === "KNOCKOUT_WINNER" &&
      metadataString(row.metadata, "matchId") === input.matchId,
  );
  const championRows = input.includeChampionBonus
    ? input.pointsRows.filter(
        (row) =>
          row.source_type === "CHAMPION" &&
          metadataString(row.metadata, "matchId") === input.matchId,
      )
    : [];
  const hits = winnerRows.filter((row) => row.points_awarded > 0).length;
  const misses = winnerRows.filter((row) => row.points_awarded === 0).length;
  const pointsAwarded = [...winnerRows, ...championRows].reduce(
    (total, row) => total + row.points_awarded,
    0,
  );

  return buildImpactSummary({
    description:
      hits + misses > 0
        ? `${hits} aciertos y ${misses} fallos en este cruce.`
        : "Todavía no hay picks puntuables guardados para este cruce.",
    hits,
    misses,
    pointsAwarded,
    sourceType: "KNOCKOUT_WINNER",
  });
}

function byNewestDate<T extends { sortAt: string }>(items: T[]) {
  return [...items].sort(
    (left, right) =>
      new Date(right.sortAt).getTime() - new Date(left.sortAt).getTime(),
  );
}

function toRevealState(input: {
  isCurrentUser: boolean;
  isLocked: boolean;
  isResolved: boolean;
}): PredictionRevealState {
  if (!input.isCurrentUser && !input.isLocked) {
    return "HIDDEN_UNTIL_LOCK";
  }

  return input.isResolved ? "VISIBLE_RESOLVED" : "VISIBLE_PENDING";
}

function toParticipantResolutionState(input: {
  predictionVisible: boolean;
  predictedWinnerSlot: WinnerSide | null;
  winnerSide: WinnerSide | null;
}): ParticipantPredictionResolutionState {
  if (!input.predictionVisible || !input.predictedWinnerSlot) {
    return "EMPTY";
  }

  if (!input.winnerSide) {
    return "PENDING";
  }

  return input.predictedWinnerSlot === input.winnerSide ? "CORRECT" : "WRONG";
}

function buildParticipantExplorerEntries(
  rankingEntries: RankingEntry[],
  currentUserId: string,
): ParticipantExplorerEntryViewModel[] {
  return rankingEntries.map((entry) => ({
    avatarSource: entry.avatarSource,
    avatarUrl: entry.avatarUrl,
    championPoints: entry.championPoints,
    displayName: normalizeDisplayName(entry),
    groupPoints: entry.groupPoints,
    isCurrentUser: entry.userId === currentUserId,
    knockoutPoints: entry.knockoutPoints,
    position: entry.position,
    totalPoints: entry.totalPoints,
    userId: entry.userId,
    username: entry.username,
  }));
}

function buildParticipantGroups(input: {
  groupFinalStateByLetter: Map<GroupLetter, boolean>;
  groupLock: PhaseLockViewModel;
  isCurrentUser: boolean;
  pointsRows: PointRow[];
  predictions: GroupPredictionRow[];
  standingsByGroupAndTeam: Map<string, GroupStandingRow>;
  teamsById: Map<string, TeamRow>;
}): ParticipantGroupPredictionViewModel[] {
  const predictionsByGroup = new Map<GroupLetter, GroupPredictionRow[]>();

  for (const prediction of input.predictions) {
    const currentRows = predictionsByGroup.get(prediction.group_letter) ?? [];
    currentRows.push(prediction);
    predictionsByGroup.set(prediction.group_letter, currentRows);
  }

  const groupPointsByKey = new Map<string, PointRow>();

  for (const row of input.pointsRows) {
    if (row.source_type !== "GROUP_POSITION") {
      continue;
    }

    const groupLetter = metadataGroupLetter(row.metadata);
    const teamId = metadataString(row.metadata, "teamId");

    if (!groupLetter || !teamId) {
      continue;
    }

    groupPointsByKey.set(`${groupLetter}:${teamId}`, row);
  }

  return GROUP_LETTER_OPTIONS.map((groupLetter) => {
    const rows = [...(predictionsByGroup.get(groupLetter) ?? [])].sort(
      (left, right) => left.predicted_position - right.predicted_position,
    );
    const revealState = toRevealState({
      isCurrentUser: input.isCurrentUser,
      isLocked: input.groupLock.isLocked,
      isResolved: input.groupFinalStateByLetter.get(groupLetter) ?? false,
    });
    const teams = Array.from({ length: 4 }, (_, index) => {
      const predictedPosition = index + 1;
      const prediction = rows.find(
        (candidate) => candidate.predicted_position === predictedPosition,
      );

      if (!prediction) {
        return {
          actualPosition: null,
          code: null,
          flagUrl: null,
          id: null,
          isTbd: true,
          name: "Sin pick guardado",
          pointsAwarded: null,
          predictedPosition,
          qualificationStatus: null,
          stamp: null,
        };
      }

      const team = input.teamsById.get(prediction.team_id) ?? null;
      const standing =
        input.standingsByGroupAndTeam.get(`${groupLetter}:${prediction.team_id}`) ??
        null;
      const pointsRow = groupPointsByKey.get(`${groupLetter}:${prediction.team_id}`) ?? null;

      return {
        actualPosition: standing?.position ?? metadataNumber(pointsRow?.metadata ?? null, "actualPosition"),
        code: team?.code ?? null,
        flagUrl: team?.flag_url ?? null,
        id: team?.id ?? prediction.team_id,
        isTbd: team?.is_tbd ?? false,
        name: team?.name ?? "Equipo no disponible",
        pointsAwarded: pointsRow?.points_awarded ?? null,
        predictedPosition,
        qualificationStatus:
          standing?.qualification_status ??
          (metadataString(pointsRow?.metadata ?? null, "qualificationStatus") as QualificationStatus | null),
        stamp: metadataString(pointsRow?.metadata ?? null, "stamp"),
      };
    });
    const totalPoints = teams.reduce(
      (total, team) => total + (team.pointsAwarded ?? 0),
      0,
    );

    return {
      groupLetter,
      isFinal: input.groupFinalStateByLetter.get(groupLetter) ?? false,
      revealState,
      savedCount: rows.length,
      teams,
      totalPoints:
        revealState === "HIDDEN_UNTIL_LOCK" || rows.length === 0 ? null : totalPoints,
    };
  });
}

function buildParticipantBracketRounds(input: {
  isCurrentUser: boolean;
  pointsRows: PointRow[];
  rounds: BracketRoundViewModel[];
}): ParticipantBracketRoundViewModel[] {
  const pointsByMatchId = new Map<string, PointRow>();
  const championRowsByMatchId = new Map<string, PointRow>();

  for (const row of input.pointsRows) {
    const matchId = metadataString(row.metadata, "matchId");

    if (!matchId) {
      continue;
    }

    if (row.source_type === "KNOCKOUT_WINNER") {
      pointsByMatchId.set(matchId, row);
    }

    if (row.source_type === "CHAMPION") {
      championRowsByMatchId.set(matchId, row);
    }
  }

  return input.rounds.map((round) => {
    const roundHidden =
      !input.isCurrentUser && round.matches.some((match) => !match.lock.isLocked);
    const roundResolved =
      !roundHidden &&
      round.matches.length > 0 &&
      round.matches.every((match) => {
        const pointsRow = pointsByMatchId.get(match.id) ?? null;

        return match.lock.isLocked && metadataWinnerSide(pointsRow?.metadata ?? null) !== null;
      });
    const matches = round.matches.map<ParticipantBracketMatchViewModel>((match) => {
      const predictionVisible = input.isCurrentUser || match.lock.isLocked;
      const pointsRow = pointsByMatchId.get(match.id) ?? null;
      const championRow = championRowsByMatchId.get(match.id) ?? null;
      const isResolved =
        match.lock.isLocked &&
        metadataWinnerSide(pointsRow?.metadata ?? null) !== null;
      const predictionRevealState = toRevealState({
        isCurrentUser: input.isCurrentUser,
        isLocked: match.lock.isLocked,
        isResolved,
      });

      return {
        ...match,
        awardedPoints: pointsRow?.points_awarded ?? null,
        championBonusPointsAwarded: championRow?.points_awarded ?? null,
        prediction:
          predictionVisible && match.prediction
            ? match.prediction
            : null,
        predictionRevealState,
        resolutionState: toParticipantResolutionState({
          predictionVisible,
          predictedWinnerSlot:
            predictionVisible ? match.prediction?.predictedWinnerSlot ?? null : null,
          winnerSide: metadataWinnerSide(pointsRow?.metadata ?? null),
        }),
      };
    });

    return {
      label: round.label,
      matches,
      phase: round.phase,
      revealState: roundHidden
        ? "HIDDEN_UNTIL_LOCK"
        : roundResolved
          ? "VISIBLE_RESOLVED"
          : "VISIBLE_PENDING",
    };
  });
}

async function loadGroupStandingsWithTeams(supabase: SupabaseClient) {
  const standingsResponse = await supabase
    .from("group_standings")
    .select(
      "group_letter, position, points, goals_for, goal_difference, qualification_status, is_final, updated_at, team_id",
    );

  if (standingsResponse.error) {
    throw new Error(`Could not load group standings: ${standingsResponse.error.message}`);
  }

  const standings = standingsResponse.data as GroupStandingRow[];
  const teamIds = [...new Set(standings.map((standing) => standing.team_id))];

  if (teamIds.length === 0) {
    return {
      standings,
      teamsById: new Map<string, TeamRow>(),
    };
  }

  const teamsResponse = await supabase
    .from("teams")
    .select("id, name, code, flag_url, is_tbd")
    .in("id", teamIds);

  if (teamsResponse.error) {
    throw new Error(`Could not load standings teams: ${teamsResponse.error.message}`);
  }

  return {
    standings,
    teamsById: new Map(
      (teamsResponse.data as TeamRow[]).map((team) => [team.id, team] as const),
    ),
  };
}

export async function getResultsFeed(
  supabase: SupabaseClient,
): Promise<ResultsFeedItemViewModel[]> {
  const [matchesResponse, standingsBundle, pointsResponse] = await Promise.all([
    supabase
      .from("matches")
      .select(FINISHED_MATCHES_SELECT)
      .eq("status", "FINISHED")
      .in("phase", [
        "GROUP_STAGE",
        "ROUND_OF_32",
        "ROUND_OF_16",
        "QUARTER_FINALS",
        "SEMI_FINALS",
        "FINAL",
      ]),
    loadGroupStandingsWithTeams(supabase),
    supabase
      .from("points")
      .select("user_id, source_type, source_id, points_awarded, metadata"),
  ]);

  if (matchesResponse.error) {
    throw new Error(`Could not load finished matches: ${matchesResponse.error.message}`);
  }

  if (pointsResponse.error) {
    throw new Error(`Could not load points for results feed: ${pointsResponse.error.message}`);
  }

  const pointsRows = pointsResponse.data as PointRow[];
  const matches = matchesResponse.data as MatchRow[];
  const standingsByGroup = new Map<GroupLetter, GroupStandingRow[]>();

  for (const standing of standingsBundle.standings) {
    const currentRows = standingsByGroup.get(standing.group_letter) ?? [];
    currentRows.push(standing);
    standingsByGroup.set(standing.group_letter, currentRows);
  }

  const groupMatchItems = matches
    .filter((match) => match.phase === "GROUP_STAGE" && match.group_letter)
    .map((match) => ({
      item: {
        city: match.city,
        groupLetter: match.group_letter as GroupLetter,
        id: `group-match-${match.id}`,
        impact: buildImpactSummary({
          description: buildPendingImpactCopy(match.group_letter as GroupLetter),
          hits: 0,
          misses: 0,
          pointsAwarded: 0,
          sourceType: "GROUP_POSITION",
        }),
        kickoff: match.kickoff,
        phase: "GROUP_STAGE" as const,
        score: {
          awayScore: match.away_score,
          awayTeam: normalizeTeam(match.away_team),
          homeScore: match.home_score,
          homeTeam: normalizeTeam(match.home_team),
          winnerSide: match.winner_side,
        },
        title: `Resultado oficial · Grupo ${match.group_letter}`,
        type: "GROUP_MATCH_RESULT" as const,
        venue: match.venue,
      },
      sortAt: match.kickoff,
    }));

  const groupClosureItems = [...standingsByGroup.entries()]
    .filter(([, rows]) => rows.every((row) => row.is_final))
    .map(([groupLetter, rows]) => ({
      item: {
        groupLetter,
        id: `group-closure-${groupLetter}`,
        impact: buildGroupClosureImpact(pointsRows, groupLetter),
        standings: [...rows]
          .sort((left, right) => left.position - right.position)
          .map((row) => ({
            points: row.points,
            position: row.position,
            qualificationStatus: row.qualification_status,
            team: normalizeTeam(standingsBundle.teamsById.get(row.team_id) ?? null),
          })),
        title: `Grupo ${groupLetter} cerrado`,
        type: "GROUP_CLOSURE" as const,
        updatedAt: [...rows]
          .sort(
            (left, right) =>
              new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
          )[0]?.updated_at ?? new Date(0).toISOString(),
      },
      sortAt:
        [...rows]
          .sort(
            (left, right) =>
              new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime(),
          )[0]?.updated_at ?? new Date(0).toISOString(),
    }));

  const knockoutItems = matches
    .filter((match) => match.phase !== "GROUP_STAGE")
    .map((match) => {
      const knockoutPhase = match.phase as KnockoutRoundPhase;
      const includeChampionBonus = match.phase === "FINAL";
      const baseItem = {
        city: match.city,
        id: `${match.phase === "FINAL" ? "final" : "knockout"}-${match.id}`,
        impact: buildKnockoutImpact({
          includeChampionBonus,
          matchId: match.id,
          pointsRows,
        }),
        kickoff: match.kickoff,
        phase: knockoutPhase,
        score: {
          awayScore: match.away_score,
          awayTeam: normalizeTeam(match.away_team),
          homeScore: match.home_score,
          homeTeam: normalizeTeam(match.home_team),
          winnerSide: match.winner_side,
        },
        title:
          match.phase === "FINAL"
            ? "Final resuelta"
            : `${phaseLabel(knockoutPhase)} resuelto`,
        venue: match.venue,
      };

      if (match.phase === "FINAL") {
        const championBonusPointsAwarded = pointsRows
          .filter(
            (row) =>
              row.source_type === "CHAMPION" &&
              metadataString(row.metadata, "matchId") === match.id,
          )
          .reduce((total, row) => total + row.points_awarded, 0);

        return {
          item: {
            ...baseItem,
            championBonusPointsAwarded,
            phase: "FINAL" as const,
            type: "FINAL_RESULT" as const,
          },
          sortAt: match.kickoff,
        };
      }

      return {
        item: {
          ...baseItem,
          type: "KNOCKOUT_MATCH_RESULT" as const,
        },
        sortAt: match.kickoff,
      };
    });

  return byNewestDate([
    ...groupMatchItems,
    ...groupClosureItems,
    ...knockoutItems,
  ]).map((entry) => entry.item);
}

export async function getParticipantExplorerEntries(
  supabase: SupabaseClient,
  currentUserId: string,
): Promise<ParticipantExplorerEntryViewModel[]> {
  const ranking = await getRankingByPhase(supabase);
  return buildParticipantExplorerEntries(ranking.entries, currentUserId);
}

export async function getParticipantDetail(
  supabase: SupabaseClient,
  currentUserId: string,
  participantUserId: string,
): Promise<ParticipantDetailViewModel | null> {
  const [
    rankingModel,
    breakdown,
    groupLock,
    knockoutStageOneLock,
    knockoutStageTwoLock,
    groupPredictionsResponse,
    standingsBundle,
    pointsResponse,
    bracketRounds,
  ] = await Promise.all([
    getRankingByPhase(supabase),
    getUserPointsBreakdown(supabase, participantUserId),
    getGroupStageLock(supabase),
    getPhaseLock(supabase, "KNOCKOUT_STAGE_ONE"),
    getPhaseLock(supabase, "KNOCKOUT_STAGE_TWO"),
    supabase
      .from("group_predictions")
      .select("group_letter, team_id, predicted_position")
      .eq("user_id", participantUserId),
    loadGroupStandingsWithTeams(supabase),
    supabase
      .from("points")
      .select("user_id, source_type, source_id, points_awarded, metadata")
      .eq("user_id", participantUserId),
    getBracketRounds(supabase, participantUserId),
  ]);

  if (groupPredictionsResponse.error) {
    throw new Error(
      `Could not load participant groups: ${groupPredictionsResponse.error.message}`,
    );
  }

  if (pointsResponse.error) {
    throw new Error(
      `Could not load participant points: ${pointsResponse.error.message}`,
    );
  }

  const rankingEntry =
    rankingModel.entries.find((entry) => entry.userId === participantUserId) ?? null;

  if (!rankingEntry) {
    return null;
  }

  const standingsByGroupAndTeam = new Map<string, GroupStandingRow>();
  const groupFinalStateByLetter = new Map<GroupLetter, boolean>();

  for (const standing of standingsBundle.standings) {
    standingsByGroupAndTeam.set(
      `${standing.group_letter}:${standing.team_id}`,
      standing,
    );
    groupFinalStateByLetter.set(
      standing.group_letter,
      (groupFinalStateByLetter.get(standing.group_letter) ?? true) &&
        standing.is_final,
    );
  }

  const pointsRows = pointsResponse.data as PointRow[];
  const isCurrentUser = currentUserId === participantUserId;
  const gapCopy = getUserGapCopy(rankingModel.entries, participantUserId);

  return {
    avatarSource: rankingEntry.avatarSource,
    avatarUrl: rankingEntry.avatarUrl,
    breakdown,
    bracketRounds: buildParticipantBracketRounds({
      isCurrentUser,
      pointsRows,
      rounds: bracketRounds,
    }),
    displayName: normalizeDisplayName(rankingEntry),
    gapCopy,
    groupLock,
    groups: buildParticipantGroups({
      groupFinalStateByLetter,
      groupLock,
      isCurrentUser,
      pointsRows,
      predictions: groupPredictionsResponse.data as GroupPredictionRow[],
      standingsByGroupAndTeam,
      teamsById: standingsBundle.teamsById,
    }),
    isCurrentUser,
    knockoutStageOneLock,
    knockoutStageTwoLock,
    position: rankingEntry.position,
    totalPoints: rankingEntry.totalPoints,
    userId: rankingEntry.userId,
    username: rankingEntry.username,
  };
}

export function getParticipantBlockRevealCopy(input: {
  isCurrentUser: boolean;
  lock: PhaseLockViewModel;
  label: string;
}) {
  if (input.isCurrentUser) {
    return `Tu ${input.label.toLowerCase()} se muestra aquí en modo lectura.`;
  }

  if (input.lock.isLocked) {
    return `${input.label} ya cerró y sus picks ya están visibles.`;
  }

  return `Se revela al cierre de ${input.label.toLowerCase()}.`;
}

export function getResultsFeedEmptyStateCopy(items: ResultsFeedItemViewModel[]) {
  if (items.length > 0) {
    return null;
  }

  return {
    description:
      "Los resultados oficiales y su impacto en la liga aparecerán aquí en cuanto se cierren partidos o grupos.",
    eyebrow: "Resultados todavía en espera",
    title: "El feed se enciende con los primeros desenlaces reales.",
  };
}

export function getParticipantResultsStamp(pointsBreakdown: PointsBreakdown) {
  if (pointsBreakdown.total === 0) {
    return "Sin puntos todavía";
  }

  if (pointsBreakdown.knockout > pointsBreakdown.groupStage) {
    return "Empuja fuerte en eliminatorias";
  }

  if (pointsBreakdown.groupStage > 0) {
    return "Ha construido su torneo desde grupos";
  }

  return "Sigue en carrera";
}
