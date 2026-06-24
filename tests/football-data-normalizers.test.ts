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

  it("uses football-data winner metadata to resolve the advancing side after a draw", () => {
    const matches = normalizeFootballDataMatches({
      matches: [
        {
          awayTeam: { name: "Brazil", tla: "BRA" },
          group: null,
          homeTeam: { name: "Argentina", tla: "ARG" },
          id: 537999,
          score: {
            duration: "PENALTY_SHOOTOUT",
            fullTime: { away: 1, home: 1 },
            winner: "AWAY_TEAM",
          },
          stage: "FINAL",
          status: "FINISHED",
          utcDate: "2026-07-19T19:00:00Z",
          venue: "MetLife Stadium",
        },
      ],
    });

    expect(matches[0]).toMatchObject({
      away_score: 1,
      home_score: 1,
      phase: "FINAL",
      status: "FINISHED",
      winner_side: "AWAY",
    });
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

  it("canonicalizes inconsistent team codes (Uruguay URU/URY) across endpoints", () => {
    // football-data.org returns Uruguay as URU in /teams and /standings but as
    // URY in /matches. Every endpoint must normalize to the canonical URY code
    // so the team is not dropped and the payload validates against itself.
    const teamsResponse = {
      teams: [
        { area: { code: "URU", name: "Uruguay" }, name: "Uruguay", tla: "URU" },
        { area: { code: "ESP", name: "Spain" }, name: "Spain", tla: "ESP" },
      ],
    };
    const matchesResponse = {
      matches: [
        {
          awayTeam: { name: "Spain", tla: "ESP" },
          group: "GROUP_H",
          homeTeam: { name: "Uruguay", tla: "URY" },
          id: 600001,
          score: { fullTime: { away: null, home: null } },
          stage: "GROUP_STAGE",
          status: "TIMED",
          utcDate: "2026-06-20T19:00:00Z",
          venue: "Estadio Akron",
        },
      ],
    };
    const standingsResponse = {
      standings: [
        {
          group: null,
          stage: "GROUP_STAGE",
          table: [
            {
              draw: 0, goalDifference: 1, goalsAgainst: 0, goalsFor: 1,
              lost: 0, playedGames: 1, points: 3, position: 1,
              team: { name: "Uruguay", tla: "URU" }, won: 1,
            },
            {
              draw: 0, goalDifference: -1, goalsAgainst: 1, goalsFor: 0,
              lost: 1, playedGames: 1, points: 0, position: 2,
              team: { name: "Spain", tla: "ESP" }, won: 0,
            },
          ],
          type: "TOTAL",
        },
      ],
    };

    const groupMap = createGroupMapFromFootballDataMatches(matchesResponse);
    expect(groupMap.get("URY")).toBe("H");
    expect(groupMap.has("URU")).toBe(false);

    const teams = normalizeFootballDataTeams(teamsResponse, groupMap);
    expect(teams.map((team) => team.code).sort()).toEqual(["ESP", "URY"]);

    const matches = normalizeFootballDataMatches(matchesResponse);
    expect(matches[0]?.home_team_code).toBe("URY");

    const standings = normalizeFootballDataStandings({ groupMap, standingsResponse });
    expect(standings.map((row) => row.team_code).sort()).toEqual(["ESP", "URY"]);

    // The full payload must validate: every team referenced by matches and
    // standings is present in the normalized team list.
    const tournamentData = normalizeFootballDataTournamentData({
      matchesResponse,
      standingsResponse,
      teamsResponse,
    });
    expect(tournamentData.teams.map((team) => team.code).sort()).toEqual([
      "ESP",
      "URY",
    ]);
  });

  it("keeps teams missing from a partial /teams response (built from matches)", () => {
    // football-data.org intermittently returns an incomplete /teams list (e.g.
    // only 47 of 48 teams). The dropped team must still be derived from the
    // matches so the payload validates and the sync does not fall back to the
    // stale static snapshot. Here Uruguay is entirely absent from /teams.
    const teamsResponse = {
      teams: [{ area: { code: "ESP", name: "Spain" }, name: "Spain", tla: "ESP" }],
    };
    const matchesResponse = {
      matches: [
        {
          awayTeam: { name: "Spain", tla: "ESP" },
          group: "GROUP_H",
          homeTeam: { name: "Uruguay", tla: "URY" },
          id: 600002,
          score: { fullTime: { away: 1, home: 2 } },
          stage: "GROUP_STAGE",
          status: "FINISHED",
          utcDate: "2026-06-21T19:00:00Z",
          venue: "Estadio Akron",
        },
      ],
    };
    const standingsResponse = {
      standings: [
        {
          group: null,
          stage: "GROUP_STAGE",
          table: [
            {
              draw: 0, goalDifference: 1, goalsAgainst: 1, goalsFor: 2,
              lost: 0, playedGames: 1, points: 3, position: 1,
              team: { name: "Uruguay", tla: "URY" }, won: 1,
            },
            {
              draw: 0, goalDifference: -1, goalsAgainst: 2, goalsFor: 1,
              lost: 1, playedGames: 1, points: 0, position: 2,
              team: { name: "Spain", tla: "ESP" }, won: 0,
            },
          ],
          type: "TOTAL",
        },
      ],
    };

    const tournamentData = normalizeFootballDataTournamentData({
      matchesResponse,
      standingsResponse,
      teamsResponse,
    });

    const uruguay = tournamentData.teams.find((team) => team.code === "URY");
    expect(uruguay).toMatchObject({ code: "URY", group_letter: "H", name: "Uruguay" });
    expect(tournamentData.teams.map((team) => team.code).sort()).toEqual([
      "ESP",
      "URY",
    ]);
  });
});
