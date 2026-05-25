import type {
  ApiFootballFixtureResponseItem,
  ApiFootballStandingRow,
  ApiFootballTeamResponseItem,
} from "./api-football-normalizers.ts";
import {
  mockMatches,
  mockStandings,
  mockTeams,
} from "./mock-worldcup-provider.ts";

function roundLabel(phase: string) {
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
      return "3rd Place";
    case "FINAL":
      return "Final";
    default:
      return "Group Stage";
  }
}

function statusShort(status: string) {
  switch (status) {
    case "LIVE":
      return "1H";
    case "FINISHED":
      return "FT";
    case "POSTPONED":
      return "PST";
    case "CANCELLED":
      return "CANC";
    default:
      return "NS";
  }
}

const teamByCode = new Map(mockTeams.map((team, index) => [team.code, { ...team, apiId: index + 1 }]));

function flagUrlFromTeam(team: object) {
  const value = (team as { flag_url?: unknown }).flag_url;
  return typeof value === "string" ? value : null;
}

export const STATIC_WORLD_CUP_TEAMS_RESPONSE = {
  response: mockTeams.map<ApiFootballTeamResponseItem>((team) => ({
    team: {
      code: team.code,
      id: teamByCode.get(team.code)?.apiId ?? null,
      logo: flagUrlFromTeam(team),
      name: team.name,
    },
  })),
};

export const STATIC_WORLD_CUP_FIXTURES_RESPONSE = {
  response: mockMatches.map<ApiFootballFixtureResponseItem>((match, index) => ({
    fixture: {
      date: match.kickoff,
      id: 1000 + index + 1,
      status: {
        short: statusShort(match.status),
      },
      venue: {
        city: match.city ?? null,
        name: match.venue ?? null,
      },
    },
    goals: {
      away: match.away_score ?? null,
      home: match.home_score ?? null,
    },
    league: {
      round: roundLabel(match.phase),
    },
    teams: {
      away: match.away_team_code
        ? {
            code: match.away_team_code,
            id: teamByCode.get(match.away_team_code)?.apiId ?? null,
            name: teamByCode.get(match.away_team_code)?.name ?? match.away_team_code,
          }
        : {
            code: null,
            id: null,
            name: match.away_placeholder ?? "TBD",
          },
      home: match.home_team_code
        ? {
            code: match.home_team_code,
            id: teamByCode.get(match.home_team_code)?.apiId ?? null,
            name: teamByCode.get(match.home_team_code)?.name ?? match.home_team_code,
          }
        : {
            code: null,
            id: null,
            name: match.home_placeholder ?? "TBD",
          },
    },
  })),
};

function qualificationDescription(position: number, qualificationStatus?: string) {
  if (qualificationStatus === "BEST_THIRD") {
    return "Qualification - Best third";
  }

  if (position === 1 || position === 2) {
    return "Promotion - World Cup (Round of 32)";
  }

  return null;
}

const standingsByGroup = new Map<string, ApiFootballStandingRow[]>();

for (const standing of mockStandings) {
  const rows = standingsByGroup.get(standing.group_letter) ?? [];
  const team = teamByCode.get(standing.team_code);

  rows.push({
    all: {
      draw: standing.drawn,
      goals: {
        against: standing.goals_against,
        for: standing.goals_for,
      },
      lose: standing.lost,
      played: standing.played,
      win: standing.won,
    },
    description: qualificationDescription(
      standing.position,
      standing.qualification_status,
    ),
    goalsDiff: standing.goal_difference,
    group: `Group ${standing.group_letter}`,
    points: standing.points,
    rank: standing.position,
    team: {
      code: standing.team_code,
      id: team?.apiId ?? null,
      logo: team ? flagUrlFromTeam(team) : null,
      name: team?.name ?? standing.team_code,
    },
  });

  standingsByGroup.set(standing.group_letter, rows);
}

for (const team of mockTeams) {
  const existingRows = standingsByGroup.get(team.group_letter);

  if (existingRows && existingRows.length === 4) {
    continue;
  }

  const teamsInGroup = mockTeams
    .filter((candidate) => candidate.group_letter === team.group_letter)
    .sort((left, right) => left.name.localeCompare(right.name));

  standingsByGroup.set(
    team.group_letter,
    teamsInGroup.map<ApiFootballStandingRow>((candidate, index) => ({
      all: {
        draw: 0,
        goals: {
          against: 0,
          for: 0,
        },
        lose: 0,
        played: 0,
        win: 0,
      },
      description: null,
      goalsDiff: 0,
      group: `Group ${candidate.group_letter}`,
      points: 0,
      rank: index + 1,
      team: {
        code: candidate.code,
        id: teamByCode.get(candidate.code)?.apiId ?? null,
        logo: flagUrlFromTeam(candidate),
        name: candidate.name,
      },
    })),
  );
}

export const STATIC_WORLD_CUP_STANDINGS_RESPONSE = {
  response: [
    {
      league: {
        standings: [...standingsByGroup.entries()]
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([, rows]) => rows.sort((left, right) => (left.rank ?? 0) - (right.rank ?? 0))),
      },
    },
  ],
};
