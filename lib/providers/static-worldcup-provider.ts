import {
  normalizeApiFootballTournamentData,
} from "./api-football-normalizers.ts";
import {
  STATIC_WORLD_CUP_FIXTURES_RESPONSE,
  STATIC_WORLD_CUP_STANDINGS_RESPONSE,
  STATIC_WORLD_CUP_TEAMS_RESPONSE,
} from "./static-worldcup-snapshot.ts";
import type { WorldCupProvider } from "./worldcup-provider.types.ts";

export class StaticWorldCupProvider implements WorldCupProvider {
  private readonly tournamentData = normalizeApiFootballTournamentData({
    fixturesResponse: STATIC_WORLD_CUP_FIXTURES_RESPONSE,
    standingsResponse: STATIC_WORLD_CUP_STANDINGS_RESPONSE,
    teamsResponse: STATIC_WORLD_CUP_TEAMS_RESPONSE,
  });

  async getMatches() {
    return this.tournamentData.matches.map((match) => ({ ...match }));
  }

  async getStandings() {
    return this.tournamentData.standings.map((standing) => ({ ...standing }));
  }

  async getTeams() {
    return this.tournamentData.teams.map((team) => ({ ...team }));
  }
}
