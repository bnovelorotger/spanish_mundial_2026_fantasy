import type {
  GroupLetter,
  GroupStandingDTO,
  MatchDTO,
  MatchPhase,
  MatchStatus,
  QualificationStatus,
  TeamDTO,
  WinnerSide,
} from "../types/worldcup.ts";
import { getFlagUrlForTeamCode } from "./team-flags.ts";

export const API_FOOTBALL_BASE_URL = "https://v3.football.api-sports.io";
export const WORLD_CUP_LEAGUE_ID = 1;
export const WORLD_CUP_SEASON = 2026;

interface ApiFootballEnvelope<TResponse> {
  response: TResponse;
}

interface ApiFootballStandingGroup {
  league?: {
    standings?: ApiFootballStandingRow[][];
  };
}

export interface ApiFootballStandingRow {
  all?: {
    draw?: number | null;
    goals?: {
      against?: number | null;
      for?: number | null;
    } | null;
    lose?: number | null;
    played?: number | null;
    win?: number | null;
  } | null;
  description?: string | null;
  goalsDiff?: number | null;
  group?: string | null;
  points?: number | null;
  rank?: number | null;
  team?: {
    code?: string | null;
    id?: number | null;
    logo?: string | null;
    name?: string | null;
  } | null;
}

export interface ApiFootballTeamResponseItem {
  team?: {
    code?: string | null;
    id?: number | null;
    logo?: string | null;
    name?: string | null;
  } | null;
}

export interface ApiFootballFixtureResponseItem {
  fixture?: {
    date?: string | null;
    id?: number | null;
    status?: {
      short?: string | null;
    } | null;
    venue?: {
      city?: string | null;
      name?: string | null;
    } | null;
  } | null;
  goals?: {
    away?: number | null;
    home?: number | null;
  } | null;
  league?: {
    round?: string | null;
  } | null;
  teams?: {
    away?: {
      code?: string | null;
      id?: number | null;
      name?: string | null;
      winner?: boolean | null;
    } | null;
    home?: {
      code?: string | null;
      id?: number | null;
      name?: string | null;
      winner?: boolean | null;
    } | null;
  } | null;
}

export interface NormalizedApiFootballData {
  matches: MatchDTO[];
  standings: GroupStandingDTO[];
  teams: TeamDTO[];
}

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function toGroupLetter(value: string | null | undefined): GroupLetter | null {
  const normalized = normalizeText(value)?.toUpperCase();

  if (!normalized) {
    return null;
  }

  const match = normalized.match(/GROUP\s+([A-L])$/u);

  if (match?.[1]) {
    return match[1] as GroupLetter;
  }

  if (/^[A-L]$/u.test(normalized)) {
    return normalized as GroupLetter;
  }

  return null;
}

function parseRoundToPhase(value: string | null | undefined): MatchPhase {
  const normalized = normalizeText(value)?.toLowerCase() ?? "";

  if (normalized.includes("round of 32")) {
    return "ROUND_OF_32";
  }

  if (normalized.includes("round of 16")) {
    return "ROUND_OF_16";
  }

  if (normalized.includes("quarter")) {
    return "QUARTER_FINALS";
  }

  if (normalized.includes("semi")) {
    return "SEMI_FINALS";
  }

  if (normalized.includes("3rd") || normalized.includes("third")) {
    return "THIRD_PLACE";
  }

  if (normalized.includes("final")) {
    return "FINAL";
  }

  return "GROUP_STAGE";
}

function parseStatusShort(value: string | null | undefined): MatchStatus {
  const normalized = normalizeText(value)?.toUpperCase() ?? "NS";

  if (["PST"].includes(normalized)) {
    return "POSTPONED";
  }

  if (["CANC", "ABD", "AWD", "WO"].includes(normalized)) {
    return "CANCELLED";
  }

  if (
    [
      "1H",
      "HT",
      "2H",
      "ET",
      "BT",
      "P",
      "LIVE",
      "INT",
      "SUSP",
    ].includes(normalized)
  ) {
    return "LIVE";
  }

  if (["FT", "AET", "PEN"].includes(normalized)) {
    return "FINISHED";
  }

  return "SCHEDULED";
}

function parseWinnerSide(input: {
  awayScore: number | null | undefined;
  awayWinner: boolean | null | undefined;
  homeScore: number | null | undefined;
  homeWinner: boolean | null | undefined;
}): WinnerSide | null {
  if (input.homeWinner === true) {
    return "HOME";
  }

  if (input.awayWinner === true) {
    return "AWAY";
  }

  if (
    typeof input.homeScore === "number" &&
    typeof input.awayScore === "number" &&
    input.homeScore !== input.awayScore
  ) {
    return input.homeScore > input.awayScore ? "HOME" : "AWAY";
  }

  return null;
}

function parseQualificationStatus(
  description: string | null | undefined,
  rank: number,
): QualificationStatus | undefined {
  const normalized = normalizeText(description)?.toLowerCase() ?? "";

  if (!normalized) {
    return undefined;
  }

  if (normalized.includes("best third") || normalized.includes("best 3")) {
    return "BEST_THIRD";
  }

  if (
    normalized.includes("promotion") ||
    normalized.includes("qualification") ||
    normalized.includes("qualified") ||
    normalized.includes("round of 32") ||
    normalized.includes("play offs")
  ) {
    if (rank === 1) {
      return "QUALIFIED_FIRST";
    }

    if (rank === 2) {
      return "QUALIFIED_SECOND";
    }

    if (rank === 3) {
      return "BEST_THIRD";
    }
  }

  if (normalized.includes("eliminated")) {
    return "ELIMINATED";
  }

  return undefined;
}

function assertApiResponseArray<T>(
  response: unknown,
  label: string,
): asserts response is ApiFootballEnvelope<T[]> {
  if (
    !response ||
    typeof response !== "object" ||
    !("response" in response) ||
    !Array.isArray((response as { response?: unknown }).response)
  ) {
    throw new Error(`API-Football ${label} response did not include an array payload.`);
  }
}

export function createTeamGroupMapFromStandings(
  standingsResponse: unknown,
) {
  assertApiResponseArray<ApiFootballStandingGroup>(standingsResponse, "standings");

  const groups = new Map<string, GroupLetter>();

  for (const leagueWrapper of standingsResponse.response) {
    const standingsGroups = leagueWrapper.league?.standings ?? [];

    for (const groupRows of standingsGroups) {
      for (const row of groupRows) {
        const code = normalizeText(row.team?.code)?.toUpperCase();
        const groupLetter = toGroupLetter(row.group);

        if (code && groupLetter) {
          groups.set(code, groupLetter);
        }
      }
    }
  }

  return groups;
}

export function normalizeApiFootballStandings(
  standingsResponse: unknown,
): GroupStandingDTO[] {
  assertApiResponseArray<ApiFootballStandingGroup>(standingsResponse, "standings");

  const standings: GroupStandingDTO[] = [];

  for (const leagueWrapper of standingsResponse.response) {
    const standingsGroups = leagueWrapper.league?.standings ?? [];

    for (const groupRows of standingsGroups) {
      const finalGroup = groupRows.length === 4 && groupRows.every((row) => (row.all?.played ?? 0) >= 3);

      for (const row of groupRows) {
        const groupLetter = toGroupLetter(row.group);
        const teamCode = normalizeText(row.team?.code)?.toUpperCase();
        const rank = row.rank ?? 0;

        if (!groupLetter || !teamCode || rank < 1) {
          continue;
        }

        standings.push({
          drawn: row.all?.draw ?? 0,
          goal_difference: row.goalsDiff ?? 0,
          goals_against: row.all?.goals?.against ?? 0,
          goals_for: row.all?.goals?.for ?? 0,
          group_letter: groupLetter,
          is_final: finalGroup,
          lost: row.all?.lose ?? 0,
          played: row.all?.played ?? 0,
          points: row.points ?? 0,
          position: rank,
          qualification_status: parseQualificationStatus(row.description, rank),
          team_code: teamCode,
          won: row.all?.win ?? 0,
        });
      }
    }
  }

  return standings.sort((left, right) => {
    if (left.group_letter !== right.group_letter) {
      return left.group_letter.localeCompare(right.group_letter);
    }

    return left.position - right.position;
  });
}

export function normalizeApiFootballTeams(
  teamsResponse: unknown,
  teamGroups: Map<string, GroupLetter>,
): TeamDTO[] {
  assertApiResponseArray<ApiFootballTeamResponseItem>(teamsResponse, "teams");

  const teams = teamsResponse.response.flatMap<TeamDTO>((entry) => {
    const code = normalizeText(entry.team?.code)?.toUpperCase();
    const name = normalizeText(entry.team?.name);

    if (!code || !name) {
      return [];
    }

    const groupLetter = teamGroups.get(code);

    if (!groupLetter) {
      return [];
    }

    return [
      {
        code,
        flag_url:
          getFlagUrlForTeamCode(code) ?? normalizeText(entry.team?.logo) ?? undefined,
        group_letter: groupLetter,
        is_tbd: false,
        name,
      },
    ];
  });

  return teams.map((team) => ({ ...team })).sort((left, right) => {
    if (left.group_letter !== right.group_letter) {
      return left.group_letter.localeCompare(right.group_letter);
    }

    return left.code.localeCompare(right.code);
  });
}

function resolveTeamSlotCode(value: string | null | undefined) {
  const normalized = normalizeText(value)?.toUpperCase();
  return normalized && /^[A-Z]{3}$/u.test(normalized) ? normalized : null;
}

function resolveMatchGroupLetter(input: {
  awayCode: string | null;
  homeCode: string | null;
  phase: MatchPhase;
  teamGroups: Map<string, GroupLetter>;
}) {
  if (input.phase !== "GROUP_STAGE") {
    return undefined;
  }

  const homeGroup = input.homeCode ? input.teamGroups.get(input.homeCode) : null;
  const awayGroup = input.awayCode ? input.teamGroups.get(input.awayCode) : null;

  if (homeGroup && awayGroup && homeGroup === awayGroup) {
    return homeGroup;
  }

  return undefined;
}

export function normalizeApiFootballFixtures(
  fixturesResponse: unknown,
  teamGroups: Map<string, GroupLetter>,
): MatchDTO[] {
  assertApiResponseArray<ApiFootballFixtureResponseItem>(fixturesResponse, "fixtures");

  const normalizedMatches = fixturesResponse.response
    .map((entry, index) => {
      const phase = parseRoundToPhase(entry.league?.round);
      const homeCode = resolveTeamSlotCode(entry.teams?.home?.code);
      const awayCode = resolveTeamSlotCode(entry.teams?.away?.code);
      const homeName = normalizeText(entry.teams?.home?.name);
      const awayName = normalizeText(entry.teams?.away?.name);

      return {
        away_placeholder: awayCode ? undefined : awayName ?? undefined,
        away_score: entry.goals?.away ?? undefined,
        away_team_code: awayCode ?? undefined,
        city: normalizeText(entry.fixture?.venue?.city) ?? undefined,
        fixtureId: entry.fixture?.id ?? null,
        group_letter: resolveMatchGroupLetter({
          awayCode,
          homeCode,
          phase,
          teamGroups,
        }),
        home_placeholder: homeCode ? undefined : homeName ?? undefined,
        home_score: entry.goals?.home ?? undefined,
        home_team_code: homeCode ?? undefined,
        kickoff: normalizeText(entry.fixture?.date) ?? new Date(0).toISOString(),
        phase,
        status: parseStatusShort(entry.fixture?.status?.short),
        venue: normalizeText(entry.fixture?.venue?.name) ?? undefined,
        winner_side: parseWinnerSide({
          awayScore: entry.goals?.away,
          awayWinner: entry.teams?.away?.winner,
          homeScore: entry.goals?.home,
          homeWinner: entry.teams?.home?.winner,
        }) ?? undefined,
        weight: index,
      };
    })
    .sort((left, right) => {
      const timeDifference =
        new Date(left.kickoff).getTime() - new Date(right.kickoff).getTime();

      if (timeDifference !== 0) {
        return timeDifference;
      }

      if (left.fixtureId !== null && right.fixtureId !== null) {
        return left.fixtureId - right.fixtureId;
      }

      return left.weight - right.weight;
    });

  return normalizedMatches.map((match, index) => ({
    away_placeholder: match.away_placeholder,
    away_score: match.away_score,
    away_team_code: match.away_team_code,
    city: match.city,
    group_letter: match.group_letter,
    home_placeholder: match.home_placeholder,
    home_score: match.home_score,
    home_team_code: match.home_team_code,
    kickoff: match.kickoff,
    match_number: index + 1,
    phase: match.phase,
    status: match.status,
    venue: match.venue,
    winner_side: match.winner_side,
  }));
}

export function normalizeApiFootballTournamentData(input: {
  fixturesResponse: unknown;
  standingsResponse: unknown;
  teamsResponse: unknown;
}): NormalizedApiFootballData {
  const teamGroups = createTeamGroupMapFromStandings(input.standingsResponse);
  const standings = normalizeApiFootballStandings(input.standingsResponse);
  const teams = normalizeApiFootballTeams(input.teamsResponse, teamGroups);
  const matches = normalizeApiFootballFixtures(input.fixturesResponse, teamGroups);

  if (teams.length === 0 || matches.length === 0 || standings.length === 0) {
    throw new Error("API-Football normalization returned an empty tournament dataset.");
  }

  return {
    matches,
    standings,
    teams,
  };
}
