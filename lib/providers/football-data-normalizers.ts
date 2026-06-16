import type {
  GroupLetter,
  GroupStandingDTO,
  MatchDTO,
  MatchPhase,
  MatchStatus,
  QualificationStatus,
  TeamDTO,
} from "../types/worldcup.ts";
import { getFlagUrlForTeamCode } from "./team-flags.ts";

export const FOOTBALL_DATA_BASE_URL = "https://api.football-data.org/v4";
export const FOOTBALL_DATA_COMPETITION_CODE = "WC";
export const FOOTBALL_DATA_SEASON = 2026;

export interface FootballDataTeamResponse {
  teams?: FootballDataTeam[];
}

export interface FootballDataTeam {
  area?: {
    code?: string | null;
    flag?: string | null;
    name?: string | null;
  } | null;
  crest?: string | null;
  name?: string | null;
  tla?: string | null;
}

export interface FootballDataMatchesResponse {
  matches?: FootballDataMatch[];
}

export interface FootballDataMatch {
  awayTeam?: FootballDataMatchTeam | null;
  group?: string | null;
  homeTeam?: FootballDataMatchTeam | null;
  id?: number | null;
  score?: {
    fullTime?: {
      away?: number | null;
      home?: number | null;
    } | null;
  } | null;
  stage?: string | null;
  status?: string | null;
  utcDate?: string | null;
  venue?: string | null;
}

interface FootballDataMatchTeam {
  name?: string | null;
  shortName?: string | null;
  tla?: string | null;
}

export interface FootballDataStandingsResponse {
  standings?: FootballDataStandingGroup[];
}

export interface FootballDataStandingGroup {
  group?: string | null;
  stage?: string | null;
  table?: FootballDataStandingRow[] | null;
  type?: string | null;
}

export interface FootballDataStandingRow {
  draw?: number | null;
  goalDifference?: number | null;
  goalsAgainst?: number | null;
  goalsFor?: number | null;
  lost?: number | null;
  playedGames?: number | null;
  points?: number | null;
  position?: number | null;
  team?: {
    crest?: string | null;
    name?: string | null;
    tla?: string | null;
  } | null;
  won?: number | null;
}

function normalizeText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * football-data.org is inconsistent about a few team codes across its
 * `/teams`, `/matches` and `/standings` endpoints. Uruguay, for example, is
 * returned as `URU` by `/teams` and `/standings` but as `URY` by `/matches`.
 * Because our database (and every saved prediction) keys teams by `URY`, an
 * un-aliased payload drops Uruguay from the normalized team list, fails
 * `validateProviderPayload`, and forces the sync to fall back to the stale
 * static snapshot — which then triggers the prediction-protection guard and
 * aborts the whole run. Canonicalizing every code through this map keeps a
 * single endpoint disagreement from breaking live scoring.
 */
const FOOTBALL_DATA_TLA_ALIASES: Record<string, string> = {
  URU: "URY",
};

function canonicalTeamCode(
  value: string | null | undefined,
): string | null {
  const normalized = normalizeText(value)?.toUpperCase();

  if (!normalized) {
    return null;
  }

  return FOOTBALL_DATA_TLA_ALIASES[normalized] ?? normalized;
}

function toGroupLetter(value: string | null | undefined): GroupLetter | null {
  const normalized = normalizeText(value)?.toUpperCase();

  if (!normalized) {
    return null;
  }

  const match = normalized.match(/GROUP[_\s]?([A-L])$/u);

  if (match?.[1]) {
    return match[1] as GroupLetter;
  }

  if (/^[A-L]$/u.test(normalized)) {
    return normalized as GroupLetter;
  }

  return null;
}

function parseMatchStatus(value: string | null | undefined): MatchStatus {
  const normalized = normalizeText(value)?.toUpperCase() ?? "TIMED";

  if (["POSTPONED"].includes(normalized)) {
    return "POSTPONED";
  }

  if (["CANCELLED", "AWARDED"].includes(normalized)) {
    return "CANCELLED";
  }

  if (
    [
      "IN_PLAY",
      "PAUSED",
      "SUSPENDED",
      "EXTRA_TIME",
      "PENALTY_SHOOTOUT",
    ].includes(normalized)
  ) {
    return "LIVE";
  }

  if (["FINISHED"].includes(normalized)) {
    return "FINISHED";
  }

  return "SCHEDULED";
}

function parseMatchPhase(value: string | null | undefined): MatchPhase {
  const normalized = normalizeText(value)?.toUpperCase() ?? "GROUP_STAGE";

  switch (normalized) {
    case "LAST_32":
      return "ROUND_OF_32";
    case "LAST_16":
      return "ROUND_OF_16";
    case "QUARTER_FINALS":
      return "QUARTER_FINALS";
    case "SEMI_FINALS":
      return "SEMI_FINALS";
    case "THIRD_PLACE":
    case "THIRD_PLACE_FINAL":
      return "THIRD_PLACE";
    case "FINAL":
      return "FINAL";
    default:
      return "GROUP_STAGE";
  }
}

function isUsableCrestUrl(value: string | null | undefined) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return false;
  }

  try {
    const url = new URL(normalized);
    return (
      url.protocol === "https:" &&
      [".png", ".jpg", ".jpeg", ".webp"].some((extension) =>
        url.pathname.toLowerCase().endsWith(extension),
      )
    );
  } catch {
    return false;
  }
}

function resolveTeamFlagUrl(input: {
  crest?: string | null;
  tla: string;
}) {
  if (isUsableCrestUrl(input.crest)) {
    return normalizeText(input.crest) ?? undefined;
  }

  return getFlagUrlForTeamCode(input.tla);
}

function assertArrayField<T extends string>(
  payload: unknown,
  key: T,
  label: string,
): asserts payload is Record<T, unknown[]> {
  if (
    !payload ||
    typeof payload !== "object" ||
    !(key in payload) ||
    !Array.isArray((payload as Record<string, unknown>)[key])
  ) {
    throw new Error(`football-data.org ${label} response did not include ${key}.`);
  }
}

export function createGroupMapFromFootballDataMatches(
  matchesResponse: unknown,
) {
  assertArrayField(matchesResponse, "matches", "matches");

  const groupMap = new Map<string, GroupLetter>();

  for (const match of matchesResponse.matches as FootballDataMatch[]) {
    const phase = parseMatchPhase(match.stage);

    if (phase !== "GROUP_STAGE") {
      continue;
    }

    const groupLetter = toGroupLetter(match.group);
    const homeCode = canonicalTeamCode(match.homeTeam?.tla);
    const awayCode = canonicalTeamCode(match.awayTeam?.tla);

    if (!groupLetter) {
      continue;
    }

    if (homeCode) {
      groupMap.set(homeCode, groupLetter);
    }

    if (awayCode) {
      groupMap.set(awayCode, groupLetter);
    }
  }

  return groupMap;
}

export function normalizeFootballDataTeams(
  teamsResponse: unknown,
  groupMap: Map<string, GroupLetter>,
): TeamDTO[] {
  assertArrayField(teamsResponse, "teams", "teams");

  const teams = (teamsResponse.teams as FootballDataTeam[])
    .flatMap<TeamDTO>((team) => {
      const tla = canonicalTeamCode(team.tla);
      const name = normalizeText(team.name);

      if (!tla || !name) {
        return [];
      }

      const groupLetter = groupMap.get(tla);

      if (!groupLetter) {
        return [];
      }

      return [
        {
          code: tla,
          flag_url: resolveTeamFlagUrl({
            crest: team.crest ?? team.area?.flag ?? null,
            tla,
          }),
          group_letter: groupLetter,
          is_tbd: false,
          name,
        },
      ];
    })
    .sort((left, right) => {
      if (left.group_letter !== right.group_letter) {
        return left.group_letter.localeCompare(right.group_letter);
      }

      return left.code.localeCompare(right.code);
    });

  return teams.map((team) => ({ ...team }));
}

export function normalizeFootballDataMatches(
  matchesResponse: unknown,
): MatchDTO[] {
  assertArrayField(matchesResponse, "matches", "matches");

  const matches = (matchesResponse.matches as FootballDataMatch[])
    .map((match, index) => {
      const phase = parseMatchPhase(match.stage);
      const homeCode = canonicalTeamCode(match.homeTeam?.tla);
      const awayCode = canonicalTeamCode(match.awayTeam?.tla);
      const homeName =
        normalizeText(match.homeTeam?.shortName) ?? normalizeText(match.homeTeam?.name);
      const awayName =
        normalizeText(match.awayTeam?.shortName) ?? normalizeText(match.awayTeam?.name);

      return {
        away_score: match.score?.fullTime?.away ?? undefined,
        away_placeholder: awayCode
          ? undefined
          : createUnknownTeamPlaceholder({
              matchId: match.id,
              name: awayName,
              phase,
              side: "Away",
            }),
        away_team_code: awayCode ?? undefined,
        city: undefined,
        fixtureId: match.id ?? null,
        group_letter: phase === "GROUP_STAGE" ? toGroupLetter(match.group) ?? undefined : undefined,
        home_score: match.score?.fullTime?.home ?? undefined,
        home_placeholder: homeCode
          ? undefined
          : createUnknownTeamPlaceholder({
              matchId: match.id,
              name: homeName,
              phase,
              side: "Home",
            }),
        home_team_code: homeCode ?? undefined,
        kickoff: normalizeText(match.utcDate) ?? new Date(0).toISOString(),
        match_number: index + 1,
        phase,
        status: parseMatchStatus(match.status),
        venue: normalizeText(match.venue) ?? undefined,
      } satisfies MatchDTO & { fixtureId: number | null };
    })
    .sort((left, right) => {
      const kickoffDifference =
        new Date(left.kickoff).getTime() - new Date(right.kickoff).getTime();

      if (kickoffDifference !== 0) {
        return kickoffDifference;
      }

      if (left.fixtureId !== null && right.fixtureId !== null) {
        return left.fixtureId - right.fixtureId;
      }

      return left.match_number - right.match_number;
    });

  return matches.map((match, index) => ({
    away_score: match.away_score,
    away_placeholder: match.away_placeholder,
    away_team_code: match.away_team_code,
    city: match.city,
    group_letter: match.group_letter,
    home_score: match.home_score,
    home_placeholder: match.home_placeholder,
    home_team_code: match.home_team_code,
    kickoff: match.kickoff,
    match_number: index + 1,
    phase: match.phase,
    status: match.status,
    venue: match.venue,
  }));
}

function phasePlaceholderLabel(phase: MatchPhase) {
  switch (phase) {
    case "ROUND_OF_32":
      return "Round of 32";
    case "ROUND_OF_16":
      return "Round of 16";
    case "QUARTER_FINALS":
      return "Quarter-finals";
    case "SEMI_FINALS":
      return "Semi-finals";
    case "THIRD_PLACE":
      return "Third place";
    case "FINAL":
      return "Final";
    default:
      return "Match";
  }
}

function createUnknownTeamPlaceholder(input: {
  matchId: number | null | undefined;
  name?: string | null;
  phase: MatchPhase;
  side: "Home" | "Away";
}) {
  const knownName = normalizeText(input.name);

  if (knownName) {
    return knownName;
  }

  const phaseLabel = phasePlaceholderLabel(input.phase);
  const suffix = input.matchId ? ` ${input.matchId}` : "";
  return `TBD ${phaseLabel} ${input.side}${suffix}`;
}

function qualificationByPosition(position: number): QualificationStatus {
  if (position === 1) {
    return "QUALIFIED_FIRST";
  }

  if (position === 2) {
    return "QUALIFIED_SECOND";
  }

  return "ELIMINATED";
}

function computeBestThirdCodes(
  groupRows: GroupStandingDTO[],
) {
  return new Set(
    groupRows
      .filter((row) => row.position === 3)
      .sort((left, right) => {
        if (right.points !== left.points) {
          return right.points - left.points;
        }

        if (right.goal_difference !== left.goal_difference) {
          return right.goal_difference - left.goal_difference;
        }

        if (right.goals_for !== left.goals_for) {
          return right.goals_for - left.goals_for;
        }

        return left.team_code.localeCompare(right.team_code);
      })
      .slice(0, 8)
      .map((row) => row.team_code),
  );
}

export function normalizeFootballDataStandings(input: {
  groupMap: Map<string, GroupLetter>;
  standingsResponse: unknown;
}): GroupStandingDTO[] {
  assertArrayField(input.standingsResponse, "standings", "standings");

  const totalStanding = (input.standingsResponse.standings as FootballDataStandingGroup[]).find(
    (standing) =>
      normalizeText(standing.stage)?.toUpperCase() === "GROUP_STAGE" &&
      normalizeText(standing.type)?.toUpperCase() === "TOTAL",
  );

  if (!totalStanding?.table || totalStanding.table.length === 0) {
    throw new Error("football-data.org standings response did not include a GROUP_STAGE TOTAL table.");
  }

  const byGroup = new Map<GroupLetter, GroupStandingDTO[]>();

  for (const row of totalStanding.table) {
    const teamCode = canonicalTeamCode(row.team?.tla);

    if (!teamCode) {
      continue;
    }

    const groupLetter = input.groupMap.get(teamCode);

    if (!groupLetter) {
      continue;
    }

    const currentRows = byGroup.get(groupLetter) ?? [];
    currentRows.push({
      drawn: row.draw ?? 0,
      goal_difference: row.goalDifference ?? 0,
      goals_against: row.goalsAgainst ?? 0,
      goals_for: row.goalsFor ?? 0,
      group_letter: groupLetter,
      is_final: false,
      lost: row.lost ?? 0,
      played: row.playedGames ?? 0,
      points: row.points ?? 0,
      position: 0,
      qualification_status: undefined,
      team_code: teamCode,
      won: row.won ?? 0,
    });
    byGroup.set(groupLetter, currentRows);
  }

  const normalizedRows = [...byGroup.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .flatMap(([, rows]) => {
      const sortedRows = [...rows].sort((left, right) => {
        if (right.points !== left.points) {
          return right.points - left.points;
        }

        if (right.goal_difference !== left.goal_difference) {
          return right.goal_difference - left.goal_difference;
        }

        if (right.goals_for !== left.goals_for) {
          return right.goals_for - left.goals_for;
        }

        return left.team_code.localeCompare(right.team_code);
      });

      const groupIsFinal = sortedRows.every((row) => row.played >= 3);

      return sortedRows.map((row, index) => ({
        ...row,
        is_final: groupIsFinal,
        position: index + 1,
        qualification_status: qualificationByPosition(index + 1),
      }));
    });

  const bestThirdCodes = computeBestThirdCodes(
    normalizedRows.filter((row) => row.is_final),
  );

  return normalizedRows.map((row) => {
    if (!row.is_final) {
      return row;
    }

    if (row.position === 3 && bestThirdCodes.has(row.team_code)) {
      return {
        ...row,
        qualification_status: "BEST_THIRD" as const,
      };
    }

    if (row.position > 2) {
      return {
        ...row,
        qualification_status: "ELIMINATED" as const,
      };
    }

    return row;
  });
}

export function normalizeFootballDataTournamentData(input: {
  matchesResponse: unknown;
  standingsResponse: unknown;
  teamsResponse: unknown;
}) {
  const groupMap = createGroupMapFromFootballDataMatches(input.matchesResponse);
  const teams = normalizeFootballDataTeams(input.teamsResponse, groupMap);
  const matches = normalizeFootballDataMatches(input.matchesResponse);
  const standings = normalizeFootballDataStandings({
    groupMap,
    standingsResponse: input.standingsResponse,
  });

  if (teams.length === 0 || matches.length === 0 || standings.length === 0) {
    throw new Error("football-data.org normalization returned an empty tournament dataset.");
  }

  return {
    matches,
    standings,
    teams,
  };
}
