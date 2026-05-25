import { describe, expect, it } from "vitest";

import {
  createGroupMapFromFootballDataMatches,
  normalizeFootballDataMatches,
  normalizeFootballDataStandings,
  normalizeFootballDataTeams,
  normalizeFootballDataTournamentData,
} from "@/lib/providers/football-data-normalizers";

const sampleTeamsResponse = {
  teams: [
    {
      area: { code: "MEX", name: "Mexico" },
      crest: "https://crests.football-data.org/769.svg",
      name: "Mexico",
      tla: "MEX",
    },
    {
      area: { code: "RSA", name: "South Africa" },
      crest: "https://crests.football-data.org/9396.svg",
      name: "South Africa",
      tla: "RSA",
    },
    {
      area: { code: "KOR", name: "South Korea" },
      crest: "https://crests.football-data.org/772.png",
      name: "South Korea",
      tla: "KOR",
    },
    {
      area: { code: "CZE", name: "Czechia" },
      crest: "https://crests.football-data.org/798.svg",
      name: "Czechia",
      tla: "CZE",
    },
  ],
};

const sampleMatchesResponse = {
  matches: [
    {
      awayTeam: { name: "South Africa", tla: "RSA" },
      group: "GROUP_A",
      homeTeam: { name: "Mexico", tla: "MEX" },
      id: 537327,
      score: { fullTime: { away: null, home: null } },
      stage: "GROUP_STAGE",
      status: "TIMED",
      utcDate: "2026-06-11T19:00:00Z",
      venue: "Estadio Azteca",
    },
    {
      awayTeam: { name: "Czechia", tla: "CZE" },
      group: "GROUP_A",
      homeTeam: { name: "South Korea", tla: "KOR" },
      id: 537328,
      score: { fullTime: { away: null, home: null } },
      stage: "GROUP_STAGE",
      status: "TIMED",
      utcDate: "2026-06-12T19:00:00Z",
      venue: "BMO Field",
    },
    {
      awayTeam: { name: "Runner-up Group B", tla: null },
      group: null,
      homeTeam: { name: "Winner Group A", tla: null },
      id: 537500,
      score: { fullTime: { away: null, home: null } },
      stage: "LAST_32",
      status: "TIMED",
      utcDate: "2026-07-01T19:00:00Z",
      venue: "SoFi Stadium",
    },
  ],
};

const sampleStandingsResponse = {
  standings: [
    {
      group: null,
      stage: "GROUP_STAGE",
      table: [
        {
          draw: 0,
          goalDifference: 2,
          goalsAgainst: 0,
          goalsFor: 2,
          lost: 0,
          playedGames: 1,
          points: 3,
          position: 1,
          team: { crest: "https://crests.football-data.org/769.svg", name: "Mexico", tla: "MEX" },
          won: 1,
        },
        {
          draw: 1,
          goalDifference: 0,
          goalsAgainst: 1,
          goalsFor: 1,
          lost: 0,
          playedGames: 1,
          points: 1,
          position: 2,
          team: { crest: "https://crests.football-data.org/772.png", name: "South Korea", tla: "KOR" },
          won: 0,
        },
        {
          draw: 1,
          goalDifference: 0,
          goalsAgainst: 1,
          goalsFor: 1,
          lost: 0,
          playedGames: 1,
          points: 1,
          position: 3,
          team: { crest: "https://crests.football-data.org/798.svg", name: "Czechia", tla: "CZE" },
          won: 0,
        },
        {
          draw: 0,
          goalDifference: -2,
          goalsAgainst: 2,
          goalsFor: 0,
          lost: 1,
          playedGames: 1,
          points: 0,
          position: 4,
          team: { crest: "https://crests.football-data.org/9396.svg", name: "South Africa", tla: "RSA" },
          won: 0,
        },
      ],
      type: "TOTAL",
    },
  ],
};

describe("football-data normalizers", () => {
  it("creates a team group map from group-stage matches", () => {
    const groupMap = createGroupMapFromFootballDataMatches(sampleMatchesResponse);

    expect(groupMap.get("MEX")).toBe("A");
    expect(groupMap.get("RSA")).toBe("A");
    expect(groupMap.get("KOR")).toBe("A");
    expect(groupMap.get("CZE")).toBe("A");
  });

  it("normalizes teams into TeamDTOs with crest-or-flag fallback", () => {
    const groupMap = createGroupMapFromFootballDataMatches(sampleMatchesResponse);
    const teams = normalizeFootballDataTeams(sampleTeamsResponse, groupMap);

    expect(teams).toHaveLength(4);
    expect(teams[0]).toMatchObject({
      code: "CZE",
      group_letter: "A",
    });
    expect(teams.find((team) => team.code === "KOR")?.flag_url).toBe(
      "https://crests.football-data.org/772.png",
    );
    expect(teams.find((team) => team.code === "MEX")?.flag_url).toBe(
      "https://flagcdn.com/w80/mx.png",
    );
  });

  it("normalizes matches into MatchDTOs with football-data stage and status mapping", () => {
    const matches = normalizeFootballDataMatches(sampleMatchesResponse);

    expect(matches).toEqual([
      expect.objectContaining({
        away_team_code: "RSA",
        group_letter: "A",
        home_team_code: "MEX",
        match_number: 1,
        phase: "GROUP_STAGE",
        status: "SCHEDULED",
      }),
      expect.objectContaining({
        away_team_code: "CZE",
        group_letter: "A",
        home_team_code: "KOR",
        match_number: 2,
        phase: "GROUP_STAGE",
        status: "SCHEDULED",
      }),
      expect.objectContaining({
        away_placeholder: "Runner-up Group B",
        away_team_code: undefined,
        home_placeholder: "Winner Group A",
        home_team_code: undefined,
        match_number: 3,
        phase: "ROUND_OF_32",
        status: "SCHEDULED",
      }),
    ]);
  });

  it("normalizes standings into group rows with in-group positions", () => {
    const groupMap = createGroupMapFromFootballDataMatches(sampleMatchesResponse);
    const standings = normalizeFootballDataStandings({
      groupMap,
      standingsResponse: sampleStandingsResponse,
    });

    expect(standings).toEqual([
      expect.objectContaining({
        group_letter: "A",
        points: 3,
        position: 1,
        qualification_status: "QUALIFIED_FIRST",
        team_code: "MEX",
      }),
      expect.objectContaining({
        group_letter: "A",
        points: 1,
        position: 2,
        qualification_status: "QUALIFIED_SECOND",
        team_code: "CZE",
      }),
      expect.objectContaining({
        group_letter: "A",
        points: 1,
        position: 3,
        qualification_status: "ELIMINATED",
        team_code: "KOR",
      }),
      expect.objectContaining({
        group_letter: "A",
        points: 0,
        position: 4,
        qualification_status: "ELIMINATED",
        team_code: "RSA",
      }),
    ]);
  });

  it("normalizes the full football-data tournament payload", () => {
    const tournamentData = normalizeFootballDataTournamentData({
      matchesResponse: sampleMatchesResponse,
      standingsResponse: sampleStandingsResponse,
      teamsResponse: sampleTeamsResponse,
    });

    expect(tournamentData.teams).toHaveLength(4);
    expect(tournamentData.matches).toHaveLength(3);
    expect(tournamentData.standings).toHaveLength(4);
  });
});
