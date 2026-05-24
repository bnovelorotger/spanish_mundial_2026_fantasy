import type { WorldCupProvider } from "./worldcup-provider.types.ts";

export class ApiFootballProvider implements WorldCupProvider {
  private readonly apiKey: string | undefined;

  constructor(apiKey = process.env.WORLD_CUP_API_KEY) {
    this.apiKey = apiKey;
  }

  private unavailable(): never {
    if (!this.apiKey) {
      throw new Error(
        "ApiFootballProvider is not configured. Set WORLD_CUP_API_KEY or use WORLD_CUP_API_PROVIDER=mock.",
      );
    }

    throw new Error(
      "ApiFootballProvider is a Phase 8 skeleton only. Real external mapping lands in Phase 11.",
    );
  }

  async getMatches() {
    return this.unavailable();
  }

  async getStandings() {
    return this.unavailable();
  }

  async getTeams() {
    return this.unavailable();
  }
}
