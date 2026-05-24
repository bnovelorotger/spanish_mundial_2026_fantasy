import type {
  GroupStandingDTO,
  MatchDTO,
  TeamDTO,
} from "../types/worldcup.ts";

export type WorldCupProviderName = "apifootball" | "mock" | "static";

export interface WorldCupProvider {
  getMatches(): Promise<MatchDTO[]>;
  getStandings(): Promise<GroupStandingDTO[]>;
  getTeams(): Promise<TeamDTO[]>;
}
