import type { WorldCupProvider } from "./worldcup-provider.types.ts";
import { MockWorldCupProvider } from "./mock-worldcup-provider.ts";

// Phase 8 safe fallback: bundled deterministic data, no external dependency.
export class StaticWorldCupProvider implements WorldCupProvider {
  private readonly provider = new MockWorldCupProvider();

  async getMatches() {
    return this.provider.getMatches();
  }

  async getStandings() {
    return this.provider.getStandings();
  }

  async getTeams() {
    return this.provider.getTeams();
  }
}
