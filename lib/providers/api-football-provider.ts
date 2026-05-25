import {
  API_FOOTBALL_BASE_URL,
  WORLD_CUP_LEAGUE_ID,
  WORLD_CUP_SEASON,
  normalizeApiFootballTournamentData,
} from "./api-football-normalizers.ts";
import type {
  GroupStandingDTO,
  MatchDTO,
  TeamDTO,
} from "../types/worldcup.ts";
import type { WorldCupProvider } from "./worldcup-provider.types.ts";

interface CachedTournamentData {
  matches: MatchDTO[];
  standings: GroupStandingDTO[];
  teams: TeamDTO[];
}

export class ApiFootballProvider implements WorldCupProvider {
  private readonly apiKey: string | undefined;
  private cachedTournamentData: Promise<CachedTournamentData> | null = null;

  constructor(apiKey = process.env.WORLD_CUP_API_KEY) {
    this.apiKey = apiKey;
  }

  private async fetchEndpoint(pathname: string) {
    if (!this.apiKey) {
      throw new Error(
        "ApiFootballProvider skipped: WORLD_CUP_API_KEY is missing.",
      );
    }

    const url = new URL(pathname, API_FOOTBALL_BASE_URL);
    url.searchParams.set("league", String(WORLD_CUP_LEAGUE_ID));
    url.searchParams.set("season", String(WORLD_CUP_SEASON));

    const response = await fetch(url, {
      headers: {
        "x-apisports-key": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
        `ApiFootballProvider request failed (${response.status} ${response.statusText}) for ${pathname}.`,
      );
    }

    return response.json();
  }

  private async loadTournamentData() {
    if (!this.cachedTournamentData) {
      this.cachedTournamentData = Promise.all([
        this.fetchEndpoint("/fixtures"),
        this.fetchEndpoint("/standings"),
        this.fetchEndpoint("/teams"),
      ]).then(([fixturesResponse, standingsResponse, teamsResponse]) =>
        normalizeApiFootballTournamentData({
          fixturesResponse,
          standingsResponse,
          teamsResponse,
        }),
      );
    }

    return this.cachedTournamentData;
  }

  async getMatches() {
    const tournamentData = await this.loadTournamentData();
    return tournamentData.matches.map((match) => ({ ...match }));
  }

  async getStandings() {
    const tournamentData = await this.loadTournamentData();
    return tournamentData.standings.map((standing) => ({ ...standing }));
  }

  async getTeams() {
    const tournamentData = await this.loadTournamentData();
    return tournamentData.teams.map((team) => ({ ...team }));
  }
}
