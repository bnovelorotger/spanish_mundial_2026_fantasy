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

function readApiFootballErrors(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("errors" in payload)) {
    return [];
  }

  const errors = (payload as { errors?: unknown }).errors;

  if (Array.isArray(errors)) {
    return errors.filter((value): value is string => typeof value === "string");
  }

  if (errors && typeof errors === "object") {
    return Object.values(errors).filter(
      (value): value is string => typeof value === "string" && value.trim().length > 0,
    );
  }

  return [];
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

    const payload = await response.json();
    const apiErrors = readApiFootballErrors(payload);

    if (apiErrors.length > 0) {
      throw new Error(
        `ApiFootballProvider request rejected for ${pathname}: ${apiErrors.join(" | ")}`,
      );
    }

    return payload;
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
