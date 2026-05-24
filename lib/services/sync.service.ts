import type { SupabaseClient } from "@supabase/supabase-js";

import { ApiFootballProvider } from "../providers/api-football-provider.ts";
import { MockWorldCupProvider } from "../providers/mock-worldcup-provider.ts";
import { StaticWorldCupProvider } from "../providers/static-worldcup-provider.ts";
import type {
  WorldCupProvider,
  WorldCupProviderName,
} from "../providers/worldcup-provider.types.ts";
import { recalculateAllPoints } from "./scoring.service.ts";

import type {
  GroupStandingDTO,
  MatchDTO,
  MatchPhase,
  MatchStatus,
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

interface MatchRow {
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
  providerUsed: WorldCupProviderName;
  standings: GroupStandingDTO[];
  teams: TeamDTO[];
}

interface SyncRunSummaryPayload {
  matches_changed: boolean;
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

function normalizeNullableString(value: string | null | undefined) {
  return value ?? null;
}

export function resolveRequestedProviderName(
  rawProvider = process.env.WORLD_CUP_API_PROVIDER,
): WorldCupProviderName {
  if (rawProvider === "apifootball" || rawProvider === "static") {
    return rawProvider;
  }

  return "mock";
}

export function getProviderFallbackChain(
  providerName: WorldCupProviderName,
): WorldCupProviderName[] {
  switch (providerName) {
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
    case "apifootball":
      return new ApiFootballProvider();
    case "static":
      return new StaticWorldCupProvider();
    default:
      return new MockWorldCupProvider();
  }
}

async function loadProviderPayload(
  providerRequested: WorldCupProviderName,
): Promise<ProviderSyncPayload> {
  const providerChain = getProviderFallbackChain(providerRequested);
  let lastError: Error | null = null;

  for (const providerName of providerChain) {
    const provider = instantiateProvider(providerName);

    try {
      const [teams, matches, standings] = await Promise.all([
        provider.getTeams(),
        provider.getMatches(),
        provider.getStandings(),
      ]);

      return {
        matches,
        providerUsed: providerName,
        standings,
        teams,
      };
    } catch (error) {
      lastError =
        error instanceof Error
          ? error
          : new Error("Unknown provider failure.");
    }
  }

  throw lastError ?? new Error("No World Cup provider could return data.");
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
): SyncRunStatus {
  return providerRequested === providerUsed ? "SUCCESS" : "PARTIAL";
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
    const providerPayload = await loadProviderPayload(providerRequested);
    const teamMap = await ensureTeamMap(client, providerPayload.teams);
    const matchesSummary = await syncMatches(
      client,
      providerPayload.matches,
      teamMap,
    );
    const standingsSummary = await syncStandings(
      client,
      providerPayload.standings,
      teamMap,
    );

    const shouldRecalculate =
      matchesSummary.matchesChanged || standingsSummary.standingsChanged;
    const recalculateSummary = shouldRecalculate
      ? await recalculateAllPoints(client)
      : null;
    const status = toSyncRunStatus(
      providerRequested,
      providerPayload.providerUsed,
    );
    const summary = {
      matchesChanged: matchesSummary.matchesChanged,
      matchesSynced: matchesSummary.matchesSynced,
      pointsRecalculated: recalculateSummary !== null,
      providerRequested,
      providerUsed: providerPayload.providerUsed,
      recalculateSummary: recalculateSummary
        ? {
            awardedTotal: recalculateSummary.awardedTotal,
            rowsScored: recalculateSummary.rowsScored,
          }
        : null,
      standingsChanged: standingsSummary.standingsChanged,
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
        summary: null,
        teamsSynced: 0,
      });
    } catch {
      // Keep the original sync error as the one that bubbles up.
    }

    throw error;
  }
}
