import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiFootballProvider } from "../providers/api-football-provider.ts";
import { FootballDataProvider } from "../providers/football-data-provider.ts";
import { MockWorldCupProvider } from "../providers/mock-worldcup-provider.ts";
import { StaticWorldCupProvider } from "../providers/static-worldcup-provider.ts";
import type {
  WorldCupProvider,
  WorldCupProviderName,
} from "../providers/worldcup-provider.types.ts";
import { recalculateAllPoints } from "./scoring.service.ts";

import type {
  GroupStandingDTO,
  LockPhase,
  LockType,
  MatchDTO,
  MatchPhase,
  MatchStatus,
  PointsSourceType,
  QualificationStatus,
  SyncRunStatus,
  TeamDTO,
} from "../types/worldcup.ts";

interface TeamRow {
  code: string;
  flag_url: string | null;
  group_letter: string;
  id: string;
  is_tbd: boolean;
  name: string;
}

interface ExistingTeamGroupRow {
  code: string;
  group_letter: string;
}

interface MatchRow {
  id?: string;
  away_placeholder: string | null;
  away_score: number | null;
  away_team_id: string | null;
  city: string | null;
  group_letter: string | null;
  home_placeholder: string | null;
  home_score: number | null;
  home_team_id: string | null;
  kickoff: string;
  match_number: number;
  phase: MatchPhase;
  status: MatchStatus;
  venue: string | null;
}

interface GroupPredictionRow {
  id: string;
  team_id: string;
}

interface KnockoutPredictionRow {
  id: string;
  predicted_winner_team_id: string | null;
}

interface ChampionPredictionRow {
  id: string;
  team_id: string;
}

interface GroupStandingDependencyRow {
  id: string;
  team_id: string;
}

interface PointDependencyRow {
  id: string;
  metadata: Record<string, unknown> | null;
  source_id: string;
  source_type: PointsSourceType;
}

interface GameLockRow {
  locked: boolean;
  locked_by: LockType | null;
  phase: LockPhase;
}

interface StandingRow {
  drawn: number;
  goal_difference: number;
  goals_against: number;
  goals_for: number;
  group_letter: string;
  is_final: boolean;
  lost: number;
  played: number;
  points: number;
  position: number;
  qualification_status: QualificationStatus | null;
  team_id: string;
  won: number;
}

interface ProviderSyncPayload {
  matches: MatchDTO[];
  providerFailures: ProviderFailure[];
  providerUsed: WorldCupProviderName;
  standings: GroupStandingDTO[];
  teams: TeamDTO[];
}

export interface ProviderFailure {
  message: string;
  provider: WorldCupProviderName;
}

interface SyncRunSummaryPayload {
  matches_changed: boolean;
  provider_failures: ProviderFailure[];
  provider_requested: WorldCupProviderName;
  provider_used: WorldCupProviderName;
  recalculate_summary: {
    awarded_total: number;
    rows_scored: number;
  } | null;
  standings_changed: boolean;
}

export interface SyncSummary {
  matchesChanged: boolean;
  matchesSynced: number;
  pointsRecalculated: boolean;
  providerFailures: ProviderFailure[];
  providerRequested: WorldCupProviderName;
  providerUsed: WorldCupProviderName;
  recalculateSummary: {
    awardedTotal: number;
    rowsScored: number;
  } | null;
  standingsChanged: boolean;
  standingsSynced: number;
  status: SyncRunStatus;
  teamsSynced: number;
}

export interface StaleTeamPruneSnapshot {
  championPredictions: ChampionPredictionRow[];
  groupPredictions: GroupPredictionRow[];
  groupStandings: GroupStandingDependencyRow[];
  knockoutPredictions: KnockoutPredictionRow[];
  matches: MatchRow[];
  points: PointDependencyRow[];
  teams: Array<Pick<TeamRow, "code" | "id">>;
}

export interface StaleTeamPrunePlan {
  awayMatchIds: string[];
  championPredictionIds: string[];
  groupPredictionIds: string[];
  groupStandingIds: string[];
  homeMatchIds: string[];
  knockoutPredictionIds: string[];
  pointIds: string[];
  staleTeamCodes: string[];
  staleTeamIds: string[];
}

export class ProviderChainError extends Error {
  readonly failures: ProviderFailure[];

  constructor(message: string, failures: ProviderFailure[]) {
    super(message);
    this.name = "ProviderChainError";
    this.failures = failures;
  }
}

function normalizeNullableString(value: string | null | undefined) {
  return value ?? null;
}

export function resolveRequestedProviderName(
  rawProvider = process.env.WORLD_CUP_API_PROVIDER,
): WorldCupProviderName {
  if (
    rawProvider === "apifootball" ||
    rawProvider === "footballdata" ||
    rawProvider === "static"
  ) {
    return rawProvider;
  }

  return "mock";
}

export function getProviderFallbackChain(
  providerName: WorldCupProviderName,
): WorldCupProviderName[] {
  switch (providerName) {
    case "footballdata":
      return ["footballdata", "apifootball", "static", "mock"];
    case "apifootball":
      return ["apifootball", "static", "mock"];
    case "static":
      return ["static", "mock"];
    default:
      return ["mock"];
  }
}

function instantiateProvider(
  providerName: WorldCupProviderName,
): WorldCupProvider {
  switch (providerName) {
    case "footballdata":
      return new FootballDataProvider();
    case "apifootball":
      return new ApiFootballProvider();
    case "static":
      return new StaticWorldCupProvider();
    default:
      return new MockWorldCupProvider();
  }
}

export function validateProviderPayload(input: {
  matches: MatchDTO[];
  standings: GroupStandingDTO[];
  teams: TeamDTO[];
}) {
  const teamCodes = new Set(input.teams.map((team) => team.code));

  for (const match of input.matches) {
    if (match.home_team_code && !teamCodes.has(match.home_team_code)) {
      throw new Error(
        `Provider payload is missing team data for ${match.home_team_code}.`,
      );
    }

    if (match.away_team_code && !teamCodes.has(match.away_team_code)) {
      throw new Error(
        `Provider payload is missing team data for ${match.away_team_code}.`,
      );
    }
  }

  for (const standing of input.standings) {
    if (!teamCodes.has(standing.team_code)) {
      throw new Error(
        `Provider payload is missing standing team data for ${standing.team_code}.`,
      );
    }
  }
}

async function loadProviderData(
  provider: WorldCupProvider,
) {
  const [teams, matches, standings] = await Promise.all([
    provider.getTeams(),
    provider.getMatches(),
    provider.getStandings(),
  ]);

  validateProviderPayload({
    matches,
    standings,
    teams,
  });

  return {
    matches,
    standings,
    teams,
  };
}

export async function resolveProviderPayload(
  providerRequested: WorldCupProviderName,
  instantiate: (providerName: WorldCupProviderName) => WorldCupProvider = instantiateProvider,
): Promise<ProviderSyncPayload> {
  const providerChain = getProviderFallbackChain(providerRequested);
  const providerFailures: ProviderFailure[] = [];

  for (const providerName of providerChain) {
    const provider = instantiate(providerName);

    try {
      const providerData = await loadProviderData(provider);

      return {
        matches: providerData.matches,
        providerFailures,
        providerUsed: providerName,
        standings: providerData.standings,
        teams: providerData.teams,
      };
    } catch (error) {
      providerFailures.push({
        message:
          error instanceof Error
            ? error.message
            : "Unknown provider failure.",
        provider: providerName,
      });
    }
  }

  throw new ProviderChainError(
    "No World Cup provider could return data.",
    providerFailures,
  );
}

function toTeamUpsertPayload(teams: TeamDTO[]) {
  return teams.map((team) => ({
    code: team.code,
    flag_url: team.flag_url ?? null,
    group_letter: team.group_letter,
    is_tbd: team.is_tbd ?? false,
    name: team.name,
  }));
}

function toStandingKey(groupLetter: string, teamId: string) {
  return `${groupLetter}:${teamId}`;
}

function toMatchKey(matchNumber: number) {
  return String(matchNumber);
}

function toSyncRunStatus(
  providerRequested: WorldCupProviderName,
  providerUsed: WorldCupProviderName,
  providerFailures: ProviderFailure[],
): SyncRunStatus {
  return providerRequested === providerUsed && providerFailures.length === 0
    ? "SUCCESS"
    : "PARTIAL";
}

const STALE_TEAM_PLACEHOLDER = "Team unavailable";

const SYNCABLE_LOCK_PHASES: readonly LockPhase[] = [
  "GROUP_STAGE",
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE",
  "FINAL",
  "CHAMPION",
] as const;

function pointRowTouchesStaleTeam(
  point: PointDependencyRow,
  staleTeamIds: Set<string>,
  deletedPredictionIds: Set<string>,
) {
  const metadata = point.metadata;
  const metadataTeamId =
    metadata && typeof metadata.teamId === "string" ? metadata.teamId : null;
  const metadataPredictionId =
    metadata && typeof metadata.predictionId === "string"
      ? metadata.predictionId
      : null;

  if (metadataTeamId && staleTeamIds.has(metadataTeamId)) {
    return true;
  }

  if (metadataPredictionId && deletedPredictionIds.has(metadataPredictionId)) {
    return true;
  }

  for (const staleTeamId of staleTeamIds) {
    if (point.source_id.includes(staleTeamId)) {
      return true;
    }
  }

  return false;
}

export function buildStaleTeamPrunePlan(
  snapshot: StaleTeamPruneSnapshot,
  activeProviderCodes: string[],
): StaleTeamPrunePlan {
  const activeCodes = new Set(activeProviderCodes);
  const predictionTeamIds = new Set([
    ...snapshot.groupPredictions.map((prediction) => prediction.team_id),
    ...snapshot.championPredictions.map((prediction) => prediction.team_id),
    ...snapshot.knockoutPredictions.flatMap((prediction) =>
      prediction.predicted_winner_team_id
        ? [prediction.predicted_winner_team_id]
        : [],
    ),
  ]);
  const staleTeams = snapshot.teams.filter(
    (team) =>
      !activeCodes.has(team.code) && !predictionTeamIds.has(team.id),
  );
  const staleTeamIds = staleTeams.map((team) => team.id);
  const staleTeamCodes = staleTeams.map((team) => team.code);
  const staleTeamIdSet = new Set(staleTeamIds);
  const groupPredictionIds = snapshot.groupPredictions
    .filter((prediction) => staleTeamIdSet.has(prediction.team_id))
    .map((prediction) => prediction.id);
  const knockoutPredictionIds = snapshot.knockoutPredictions
    .filter(
      (prediction) =>
        prediction.predicted_winner_team_id !== null &&
        staleTeamIdSet.has(prediction.predicted_winner_team_id),
    )
    .map((prediction) => prediction.id);
  const championPredictionIds = snapshot.championPredictions
    .filter((prediction) => staleTeamIdSet.has(prediction.team_id))
    .map((prediction) => prediction.id);
  const deletedPredictionIds = new Set([
    ...groupPredictionIds,
    ...knockoutPredictionIds,
    ...championPredictionIds,
  ]);
  const pointIds = snapshot.points
    .filter((point) =>
      pointRowTouchesStaleTeam(point, staleTeamIdSet, deletedPredictionIds),
    )
    .map((point) => point.id);
  const groupStandingIds = snapshot.groupStandings
    .filter((standing) => staleTeamIdSet.has(standing.team_id))
    .map((standing) => standing.id);
  const homeMatchIds = snapshot.matches
    .filter(
      (match) =>
        !!match.id &&
        match.home_team_id !== null &&
        staleTeamIdSet.has(match.home_team_id),
    )
    .map((match) => match.id as string);
  const awayMatchIds = snapshot.matches
    .filter(
      (match) =>
        !!match.id &&
        match.away_team_id !== null &&
        staleTeamIdSet.has(match.away_team_id),
    )
    .map((match) => match.id as string);

  return {
    awayMatchIds,
    championPredictionIds,
    groupPredictionIds,
    groupStandingIds,
    homeMatchIds,
    knockoutPredictionIds,
    pointIds,
    staleTeamCodes,
    staleTeamIds,
  };
}

export function applyStaleTeamPrunePlan(
  snapshot: StaleTeamPruneSnapshot,
  plan: StaleTeamPrunePlan,
): StaleTeamPruneSnapshot {
  const groupPredictionIds = new Set(plan.groupPredictionIds);
  const knockoutPredictionIds = new Set(plan.knockoutPredictionIds);
  const championPredictionIds = new Set(plan.championPredictionIds);
  const groupStandingIds = new Set(plan.groupStandingIds);
  const pointIds = new Set(plan.pointIds);
  const staleTeamIds = new Set(plan.staleTeamIds);
  const homeMatchIds = new Set(plan.homeMatchIds);
  const awayMatchIds = new Set(plan.awayMatchIds);

  return {
    championPredictions: snapshot.championPredictions.filter(
      (prediction) => !championPredictionIds.has(prediction.id),
    ),
    groupPredictions: snapshot.groupPredictions.filter(
      (prediction) => !groupPredictionIds.has(prediction.id),
    ),
    groupStandings: snapshot.groupStandings.filter(
      (standing) => !groupStandingIds.has(standing.id),
    ),
    knockoutPredictions: snapshot.knockoutPredictions.filter(
      (prediction) => !knockoutPredictionIds.has(prediction.id),
    ),
    matches: snapshot.matches.map((match) => {
      const matchId = match.id ?? "";

      return {
        ...match,
        away_placeholder: awayMatchIds.has(matchId)
          ? STALE_TEAM_PLACEHOLDER
          : match.away_placeholder,
        away_team_id: awayMatchIds.has(matchId) ? null : match.away_team_id,
        home_placeholder: homeMatchIds.has(matchId)
          ? STALE_TEAM_PLACEHOLDER
          : match.home_placeholder,
        home_team_id: homeMatchIds.has(matchId) ? null : match.home_team_id,
      };
    }),
    points: snapshot.points.filter((point) => !pointIds.has(point.id)),
    teams: snapshot.teams.filter((team) => !staleTeamIds.has(team.id)),
  };
}

interface PhaseKickoffInput {
  kickoff: string;
  phase: MatchPhase;
}

interface GameLockSyncRow {
  lock_at: string;
  locked: boolean;
  locked_by: LockType;
  phase: LockPhase;
}

export function buildGameLockSyncRows(
  matches: PhaseKickoffInput[],
  existingLocks: GameLockRow[] = [],
): GameLockSyncRow[] {
  const earliestKickoffByPhase = new Map<MatchPhase, string>();

  for (const match of matches) {
    const currentKickoff = earliestKickoffByPhase.get(match.phase);

    if (!currentKickoff || match.kickoff < currentKickoff) {
      earliestKickoffByPhase.set(match.phase, match.kickoff);
    }
  }

  const championKickoff = earliestKickoffByPhase.get("FINAL");
  const existingLockByPhase = new Map(
    existingLocks.map((lock) => [lock.phase, lock] as const),
  );

  return SYNCABLE_LOCK_PHASES.flatMap((phase) => {
    const kickoff =
      phase === "CHAMPION"
        ? championKickoff
        : earliestKickoffByPhase.get(phase);
    const existingLock = existingLockByPhase.get(phase);

    if (!kickoff || existingLock?.locked_by === "MANUAL") {
      return [];
    }

    return [
      {
        lock_at: kickoff,
        locked: false,
        locked_by: "AUTOMATIC" as const,
        phase,
      },
    ];
  });
}

export function hasMatchPayloadChanged(
  existingMatch: MatchRow | undefined,
  payload: {
    away_placeholder: string | null;
    away_score: number | null;
    away_team_id: string | null;
    city: string | null;
    group_letter: string | null;
    home_placeholder: string | null;
    home_score: number | null;
    home_team_id: string | null;
    kickoff: string;
    phase: MatchPhase;
    status: MatchStatus;
    venue: string | null;
  },
) {
  if (!existingMatch) {
    return true;
  }

  return (
    existingMatch.phase !== payload.phase ||
    existingMatch.group_letter !== payload.group_letter ||
    existingMatch.home_team_id !== payload.home_team_id ||
    existingMatch.away_team_id !== payload.away_team_id ||
    existingMatch.home_placeholder !== payload.home_placeholder ||
    existingMatch.away_placeholder !== payload.away_placeholder ||
    existingMatch.home_score !== payload.home_score ||
    existingMatch.away_score !== payload.away_score ||
    existingMatch.status !== payload.status ||
    existingMatch.venue !== payload.venue ||
    existingMatch.city !== payload.city ||
    existingMatch.kickoff !== payload.kickoff
  );
}

export function hasStandingPayloadChanged(
  existingStanding: StandingRow | undefined,
  payload: {
    drawn: number;
    goal_difference: number;
    goals_against: number;
    goals_for: number;
    is_final: boolean;
    lost: number;
    played: number;
    points: number;
    position: number;
    qualification_status: QualificationStatus | null;
    won: number;
  },
) {
  if (!existingStanding) {
    return true;
  }

  return (
    existingStanding.position !== payload.position ||
    existingStanding.played !== payload.played ||
    existingStanding.won !== payload.won ||
    existingStanding.drawn !== payload.drawn ||
    existingStanding.lost !== payload.lost ||
    existingStanding.goals_for !== payload.goals_for ||
    existingStanding.goals_against !== payload.goals_against ||
    existingStanding.goal_difference !== payload.goal_difference ||
    existingStanding.points !== payload.points ||
    existingStanding.qualification_status !== payload.qualification_status ||
    existingStanding.is_final !== payload.is_final
  );
}

async function ensureTeamMap(supabase: SupabaseClient, teams: TeamDTO[]) {
  const codes = teams.map((team) => team.code);

  const upsertResponse = await supabase
    .from("teams")
    .upsert(toTeamUpsertPayload(teams), { onConflict: "code" });

  if (upsertResponse.error) {
    throw new Error(`Could not upsert teams: ${upsertResponse.error.message}`);
  }

  const teamsResponse = await supabase
    .from("teams")
    .select("id, code, name, group_letter, flag_url, is_tbd")
    .in("code", codes);

  if (teamsResponse.error) {
    throw new Error(`Could not reload teams after sync: ${teamsResponse.error.message}`);
  }

  const rows = teamsResponse.data as TeamRow[];
  return new Map(rows.map((team) => [team.code, team]));
}

async function deleteRowsByIds(
  supabase: SupabaseClient,
  table: string,
  ids: string[],
) {
  if (ids.length === 0) {
    return;
  }

  const { error } = await supabase.from(table).delete().in("id", ids);

  if (error) {
    throw new Error(`Could not delete ${table}: ${error.message}`);
  }
}

async function pruneStaleTeams(
  supabase: SupabaseClient,
  teams: TeamDTO[],
) {
  const [teamsResponse, groupPredictionsResponse, knockoutPredictionsResponse, championPredictionsResponse, pointsResponse, groupStandingsResponse, matchesResponse] =
    await Promise.all([
      supabase.from("teams").select("id, code"),
      supabase.from("group_predictions").select("id, team_id"),
      supabase
        .from("knockout_predictions")
        .select("id, predicted_winner_team_id"),
      supabase.from("champion_predictions").select("id, team_id"),
      supabase.from("points").select("id, source_id, source_type, metadata"),
      supabase.from("group_standings").select("id, team_id"),
      supabase
        .from("matches")
        .select(
          "id, match_number, phase, group_letter, home_team_id, away_team_id, home_placeholder, away_placeholder, home_score, away_score, status, venue, city, kickoff",
        ),
    ]);

  if (teamsResponse.error) {
    throw new Error(`Could not load existing teams before pruning: ${teamsResponse.error.message}`);
  }

  if (groupPredictionsResponse.error) {
    throw new Error(
      `Could not load group predictions before pruning: ${groupPredictionsResponse.error.message}`,
    );
  }

  if (knockoutPredictionsResponse.error) {
    throw new Error(
      `Could not load knockout predictions before pruning: ${knockoutPredictionsResponse.error.message}`,
    );
  }

  if (championPredictionsResponse.error) {
    throw new Error(
      `Could not load champion predictions before pruning: ${championPredictionsResponse.error.message}`,
    );
  }

  if (pointsResponse.error) {
    throw new Error(`Could not load points before pruning: ${pointsResponse.error.message}`);
  }

  if (groupStandingsResponse.error) {
    throw new Error(
      `Could not load group standings before pruning: ${groupStandingsResponse.error.message}`,
    );
  }

  if (matchesResponse.error) {
    throw new Error(`Could not load matches before pruning: ${matchesResponse.error.message}`);
  }

  const plan = buildStaleTeamPrunePlan(
    {
      championPredictions: championPredictionsResponse.data as ChampionPredictionRow[],
      groupPredictions: groupPredictionsResponse.data as GroupPredictionRow[],
      groupStandings: groupStandingsResponse.data as GroupStandingDependencyRow[],
      knockoutPredictions: knockoutPredictionsResponse.data as KnockoutPredictionRow[],
      matches: matchesResponse.data as MatchRow[],
      points: pointsResponse.data as PointDependencyRow[],
      teams: teamsResponse.data as Array<Pick<TeamRow, "code" | "id">>,
    },
    teams.map((team) => team.code),
  );

  if (plan.staleTeamIds.length === 0) {
    return {
      prunedTeamCodes: [] as string[],
      prunedTeams: 0,
    };
  }

  await deleteRowsByIds(supabase, "group_predictions", plan.groupPredictionIds);
  await deleteRowsByIds(supabase, "knockout_predictions", plan.knockoutPredictionIds);
  await deleteRowsByIds(supabase, "champion_predictions", plan.championPredictionIds);
  await deleteRowsByIds(supabase, "points", plan.pointIds);
  await deleteRowsByIds(supabase, "group_standings", plan.groupStandingIds);

  if (plan.homeMatchIds.length > 0) {
    const { error } = await supabase
      .from("matches")
      .update({
        home_placeholder: STALE_TEAM_PLACEHOLDER,
        home_team_id: null,
      })
      .in("id", plan.homeMatchIds);

    if (error) {
      throw new Error(`Could not detach stale home teams from matches: ${error.message}`);
    }
  }

  if (plan.awayMatchIds.length > 0) {
    const { error } = await supabase
      .from("matches")
      .update({
        away_placeholder: STALE_TEAM_PLACEHOLDER,
        away_team_id: null,
      })
      .in("id", plan.awayMatchIds);

    if (error) {
      throw new Error(`Could not detach stale away teams from matches: ${error.message}`);
    }
  }

  await deleteRowsByIds(supabase, "teams", plan.staleTeamIds);

  return {
    prunedTeamCodes: plan.staleTeamCodes,
    prunedTeams: plan.staleTeamIds.length,
  };
}

async function clearGroupStandingsForTeamDrift(
  supabase: SupabaseClient,
  teams: TeamDTO[],
) {
  const codes = teams.map((team) => team.code);
  const existingTeamsResponse = await supabase
    .from("teams")
    .select("code, group_letter")
    .in("code", codes);

  if (existingTeamsResponse.error) {
    throw new Error(
      `Could not inspect existing teams before sync: ${existingTeamsResponse.error.message}`,
    );
  }

  const incomingGroupByCode = new Map(
    teams.map((team) => [team.code, team.group_letter] as const),
  );
  const existingTeams = existingTeamsResponse.data as ExistingTeamGroupRow[];
  const driftedGroups = new Set<string>();

  for (const existingTeam of existingTeams) {
    const incomingGroup = incomingGroupByCode.get(existingTeam.code);

    if (!incomingGroup || incomingGroup === existingTeam.group_letter) {
      continue;
    }

    driftedGroups.add(existingTeam.group_letter);
    driftedGroups.add(incomingGroup);
  }

  if (driftedGroups.size === 0) {
    return false;
  }

  const clearResponse = await supabase
    .from("group_standings")
    .delete()
    .in("group_letter", [...driftedGroups]);

  if (clearResponse.error) {
    throw new Error(
      `Could not clear group standings before team regrouping: ${clearResponse.error.message}`,
    );
  }

  return true;
}

function resolveTeamId(teamMap: Map<string, TeamRow>, teamCode?: string) {
  if (!teamCode) {
    return null;
  }

  const team = teamMap.get(teamCode);

  if (!team) {
    throw new Error(`Could not resolve synced team code: ${teamCode}`);
  }

  return team.id;
}

function resolveRequiredTeamId(
  teamMap: Map<string, TeamRow>,
  teamCode: string,
) {
  const teamId = resolveTeamId(teamMap, teamCode);

  if (!teamId) {
    throw new Error(`Could not resolve synced team code: ${teamCode}`);
  }

  return teamId;
}

async function syncMatches(
  supabase: SupabaseClient,
  matches: MatchDTO[],
  teamMap: Map<string, TeamRow>,
) {
  const matchNumbers = matches.map((match) => match.match_number);
  const existingResponse = await supabase
    .from("matches")
    .select(
      "match_number, phase, group_letter, home_team_id, away_team_id, home_placeholder, away_placeholder, home_score, away_score, status, venue, city, kickoff",
    )
    .in("match_number", matchNumbers);

  if (existingResponse.error) {
    throw new Error(`Could not load existing matches: ${existingResponse.error.message}`);
  }

  const existingMatches = new Map(
    (existingResponse.data as MatchRow[]).map((match) => [
      toMatchKey(match.match_number),
      match,
    ]),
  );

  let matchesChanged = false;
  const payload = matches.map((match) => {
    const row = {
      away_placeholder: normalizeNullableString(match.away_placeholder),
      away_score: match.away_score ?? null,
      away_team_id: resolveTeamId(teamMap, match.away_team_code),
      city: normalizeNullableString(match.city),
      group_letter: normalizeNullableString(match.group_letter),
      home_placeholder: normalizeNullableString(match.home_placeholder),
      home_score: match.home_score ?? null,
      home_team_id: resolveTeamId(teamMap, match.home_team_code),
      kickoff: match.kickoff,
      match_number: match.match_number,
      phase: match.phase,
      status: match.status,
      venue: normalizeNullableString(match.venue),
    };

    if (
      hasMatchPayloadChanged(
        existingMatches.get(toMatchKey(match.match_number)),
        row,
      )
    ) {
      matchesChanged = true;
    }

    return row;
  });

  const upsertResponse = await supabase
    .from("matches")
    .upsert(payload, { onConflict: "match_number" });

  if (upsertResponse.error) {
    throw new Error(`Could not upsert matches: ${upsertResponse.error.message}`);
  }

  return {
    matchesChanged,
    matchesSynced: payload.length,
  };
}

async function syncGameLocksFromMatches(supabase: SupabaseClient) {
  const [matchesResponse, existingLocksResponse] = await Promise.all([
    supabase.from("matches").select("phase, kickoff"),
    supabase.from("game_locks").select("phase, locked, locked_by"),
  ]);

  if (matchesResponse.error) {
    throw new Error(`Could not load matches for game locks: ${matchesResponse.error.message}`);
  }

  if (existingLocksResponse.error) {
    throw new Error(
      `Could not load existing game locks: ${existingLocksResponse.error.message}`,
    );
  }

  const rows = buildGameLockSyncRows(
    (matchesResponse.data as Array<Pick<MatchRow, "kickoff" | "phase">>) ?? [],
    (existingLocksResponse.data as GameLockRow[]) ?? [],
  );

  if (rows.length === 0) {
    return 0;
  }

  const { error } = await supabase.from("game_locks").upsert(rows, {
    onConflict: "phase",
  });

  if (error) {
    throw new Error(`Could not sync game locks: ${error.message}`);
  }

  return rows.length;
}

async function syncStandings(
  supabase: SupabaseClient,
  standings: GroupStandingDTO[],
  teamMap: Map<string, TeamRow>,
) {
  const groupLetters = [...new Set(standings.map((standing) => standing.group_letter))];
  const existingResponse = await supabase
    .from("group_standings")
    .select(
      "group_letter, team_id, position, played, won, drawn, lost, goals_for, goals_against, goal_difference, points, qualification_status, is_final",
    )
    .in("group_letter", groupLetters);

  if (existingResponse.error) {
    throw new Error(
      `Could not load existing standings: ${existingResponse.error.message}`,
    );
  }

  const existingStandings = new Map(
    (existingResponse.data as StandingRow[]).map((standing) => [
      toStandingKey(standing.group_letter, standing.team_id),
      standing,
    ]),
  );

  let standingsChanged = false;
  const payload = standings.map((standing) => {
    const teamId = resolveRequiredTeamId(teamMap, standing.team_code);
    const row = {
      drawn: standing.drawn,
      goal_difference: standing.goal_difference,
      goals_against: standing.goals_against,
      goals_for: standing.goals_for,
      group_letter: standing.group_letter,
      is_final: standing.is_final,
      lost: standing.lost,
      played: standing.played,
      points: standing.points,
      position: standing.position,
      qualification_status: standing.qualification_status ?? null,
      team_id: teamId,
      won: standing.won,
    };

    if (
      hasStandingPayloadChanged(
        existingStandings.get(toStandingKey(standing.group_letter, teamId)),
        row,
      )
    ) {
      standingsChanged = true;
    }

    return row;
  });

  const deleteResponse = await supabase
    .from("group_standings")
    .delete()
    .in("group_letter", groupLetters);

  if (deleteResponse.error) {
    throw new Error(
      `Could not clear existing standings before sync: ${deleteResponse.error.message}`,
    );
  }

  const upsertResponse = await supabase
    .from("group_standings")
    .upsert(payload, { onConflict: "group_letter,team_id" });

  if (upsertResponse.error) {
    throw new Error(
      `Could not upsert group standings: ${upsertResponse.error.message}`,
    );
  }

  return {
    standingsChanged,
    standingsSynced: payload.length,
  };
}

async function logSyncRun(
  supabase: SupabaseClient,
  input: {
    errorMessage?: string;
    finishedAt: string;
    pointsRecalculated: boolean;
    provider: string;
    startedAt: string;
    standingsSynced: number;
    status: SyncRunStatus;
    summary: SyncRunSummaryPayload | null;
    teamsSynced: number;
    matchesSynced: number;
  },
) {
  const { error } = await supabase.from("sync_runs").insert({
    error_message: input.errorMessage ?? null,
    finished_at: input.finishedAt,
    matches_synced: input.matchesSynced,
    points_recalculated: input.pointsRecalculated,
    provider: input.provider,
    started_at: input.startedAt,
    standings_synced: input.standingsSynced,
    status: input.status,
    summary: input.summary,
    teams_synced: input.teamsSynced,
  });

  if (error) {
    throw new Error(`Could not log sync run: ${error.message}`);
  }
}

export async function syncWorldCupData(
  supabase?: SupabaseClient,
): Promise<SyncSummary> {
  const providerRequested = resolveRequestedProviderName();
  const startedAt = new Date().toISOString();
  const client =
    supabase ?? (await import("../supabase/admin.ts")).createAdminClient();

  try {
    const providerPayload = await resolveProviderPayload(providerRequested);
    let pruningChanged = false;

    try {
      const pruneSummary = await pruneStaleTeams(client, providerPayload.teams);
      pruningChanged = pruneSummary.prunedTeams > 0;
    } catch (error) {
      providerPayload.providerFailures.push({
        message:
          error instanceof Error
            ? `Stale team pruning failed: ${error.message}`
            : "Stale team pruning failed.",
        provider: providerPayload.providerUsed,
      });
    }

    const standingsPrecleared = await clearGroupStandingsForTeamDrift(
      client,
      providerPayload.teams,
    );
    const teamMap = await ensureTeamMap(client, providerPayload.teams);
    const matchesSummary = await syncMatches(
      client,
      providerPayload.matches,
      teamMap,
    );
    await syncGameLocksFromMatches(client);
    const standingsSummary = await syncStandings(
      client,
      providerPayload.standings,
      teamMap,
    );

    const shouldRecalculate =
      pruningChanged ||
      matchesSummary.matchesChanged ||
      standingsSummary.standingsChanged ||
      standingsPrecleared;
    const standingsChanged =
      standingsSummary.standingsChanged || standingsPrecleared || pruningChanged;
    const recalculateSummary = shouldRecalculate
      ? await recalculateAllPoints(client)
      : null;
    const status = toSyncRunStatus(
      providerRequested,
      providerPayload.providerUsed,
      providerPayload.providerFailures,
    );
    const summary = {
      matchesChanged: matchesSummary.matchesChanged,
      matchesSynced: matchesSummary.matchesSynced,
      pointsRecalculated: recalculateSummary !== null,
      providerFailures: providerPayload.providerFailures,
      providerRequested,
      providerUsed: providerPayload.providerUsed,
      recalculateSummary: recalculateSummary
        ? {
            awardedTotal: recalculateSummary.awardedTotal,
            rowsScored: recalculateSummary.rowsScored,
          }
        : null,
      standingsChanged,
      standingsSynced: standingsSummary.standingsSynced,
      status,
      teamsSynced: providerPayload.teams.length,
    } satisfies SyncSummary;

    await logSyncRun(client, {
      finishedAt: new Date().toISOString(),
      matchesSynced: summary.matchesSynced,
      pointsRecalculated: summary.pointsRecalculated,
      provider: summary.providerUsed,
      startedAt,
      standingsSynced: summary.standingsSynced,
      status,
      summary: {
        matches_changed: summary.matchesChanged,
        provider_failures: summary.providerFailures,
        provider_requested: summary.providerRequested,
        provider_used: summary.providerUsed,
        recalculate_summary: summary.recalculateSummary
          ? {
              awarded_total: summary.recalculateSummary.awardedTotal,
              rows_scored: summary.recalculateSummary.rowsScored,
            }
          : null,
        standings_changed: summary.standingsChanged,
      },
      teamsSynced: summary.teamsSynced,
    });

    return summary;
  } catch (error) {
    try {
      await logSyncRun(client, {
        errorMessage:
          error instanceof Error ? error.message : "Unknown sync failure.",
        finishedAt: new Date().toISOString(),
        matchesSynced: 0,
        pointsRecalculated: false,
        provider: providerRequested,
        startedAt,
        standingsSynced: 0,
        status: "FAILED",
        summary:
          error instanceof ProviderChainError
            ? {
                matches_changed: false,
                provider_failures: error.failures,
                provider_requested: providerRequested,
                provider_used: providerRequested,
                recalculate_summary: null,
                standings_changed: false,
              }
            : null,
        teamsSynced: 0,
      });
    } catch {
      // Keep the original sync error as the one that bubbles up.
    }

    throw error;
  }
}
