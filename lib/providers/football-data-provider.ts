import type {
  GroupStandingDTO,
  MatchDTO,
  TeamDTO,
} from "../types/worldcup.ts";
import {
  FOOTBALL_DATA_BASE_URL,
  FOOTBALL_DATA_COMPETITION_CODE,
  FOOTBALL_DATA_SEASON,
  normalizeFootballDataTournamentData,
} from "./football-data-normalizers.ts";
import type { WorldCupProvider } from "./worldcup-provider.types.ts";

interface CachedTournamentData {
  matches: MatchDTO[];
  standings: GroupStandingDTO[];
  teams: TeamDTO[];
}

export class FootballDataProvider implements WorldCupProvider {
  private readonly apiKey: string | undefined;
  private cachedTournamentData: Promise<CachedTournamentData> | null = null;

  constructor(apiKey = process.env.WORLD_CUP_API_KEY) {
    this.apiKey = apiKey;
  }

  private async fetchEndpoint(pathname: string) {
    if (!this.apiKey) {
      throw new Error(
        "FootballDataProvider skipped: WORLD_CUP_API_KEY is missing.",
      );
    }

    const normalizedPathname = pathname.replace(/^\/+/, "");
    const url = new URL(normalizedPathname, `${FOOTBALL_DATA_BASE_URL}/`);
    url.searchParams.set("season", String(FOOTBALL_DATA_SEASON));

    const response = await fetch(url, {
      headers: {
        "X-Auth-Token": this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
        `FootballDataProvider request failed (${response.status} ${response.statusText}) for ${pathname}.`,
      );
    }

    return response.json();
  }

  private async loadTournamentData() {
    if (!this.cachedTournamentData) {
      const basePath = `/competitions/${FOOTBALL_DATA_COMPETITION_CODE}`;

      this.cachedTournamentData = Promise.all([
        this.fetchEndpoint(`${basePath}/teams`),
        this.fetchEndpoint(`${basePath}/matches`),
        this.fetchEndpoint(`${basePath}/standings`),
      ]).then(([teamsResponse, matchesResponse, standingsResponse]) =>
        normalizeFootballDataTournamentData({
          matchesResponse,
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
