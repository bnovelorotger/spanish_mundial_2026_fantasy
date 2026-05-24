import type {
  GroupStandingDTO,
  MatchDTO,
  TeamDTO,
} from "../types/worldcup.ts";
import type { WorldCupProvider } from "./worldcup-provider.types.ts";

const teams = [
  { code: "CAN", group_letter: "A", is_tbd: false, name: "Canada" },
  { code: "MEX", group_letter: "A", is_tbd: false, name: "Mexico" },
  { code: "USA", group_letter: "A", is_tbd: false, name: "United States" },
  { code: "CRC", group_letter: "A", is_tbd: false, name: "Costa Rica" },
  { code: "ARG", group_letter: "B", is_tbd: false, name: "Argentina" },
  { code: "CHL", group_letter: "B", is_tbd: false, name: "Chile" },
  { code: "PER", group_letter: "B", is_tbd: false, name: "Peru" },
  { code: "VEN", group_letter: "B", is_tbd: false, name: "Venezuela" },
  { code: "BRA", group_letter: "C", is_tbd: false, name: "Brazil" },
  { code: "COL", group_letter: "C", is_tbd: false, name: "Colombia" },
  { code: "ECU", group_letter: "C", is_tbd: false, name: "Ecuador" },
  { code: "PRY", group_letter: "C", is_tbd: false, name: "Paraguay" },
  { code: "FRA", group_letter: "D", is_tbd: false, name: "France" },
  { code: "DEU", group_letter: "D", is_tbd: false, name: "Germany" },
  { code: "NLD", group_letter: "D", is_tbd: false, name: "Netherlands" },
  { code: "CHE", group_letter: "D", is_tbd: false, name: "Switzerland" },
  { code: "ESP", group_letter: "E", is_tbd: false, name: "Spain" },
  { code: "PRT", group_letter: "E", is_tbd: false, name: "Portugal" },
  { code: "HRV", group_letter: "E", is_tbd: false, name: "Croatia" },
  { code: "SRB", group_letter: "E", is_tbd: false, name: "Serbia" },
  { code: "BEL", group_letter: "F", is_tbd: false, name: "Belgium" },
  { code: "DNK", group_letter: "F", is_tbd: false, name: "Denmark" },
  { code: "SWE", group_letter: "F", is_tbd: false, name: "Sweden" },
  { code: "POL", group_letter: "F", is_tbd: false, name: "Poland" },
  { code: "MAR", group_letter: "G", is_tbd: false, name: "Morocco" },
  { code: "SEN", group_letter: "G", is_tbd: false, name: "Senegal" },
  { code: "NGA", group_letter: "G", is_tbd: false, name: "Nigeria" },
  { code: "GHA", group_letter: "G", is_tbd: false, name: "Ghana" },
  { code: "JPN", group_letter: "H", is_tbd: false, name: "Japan" },
  { code: "KOR", group_letter: "H", is_tbd: false, name: "South Korea" },
  { code: "AUS", group_letter: "H", is_tbd: false, name: "Australia" },
  { code: "IRN", group_letter: "H", is_tbd: false, name: "Iran" },
  { code: "URY", group_letter: "I", is_tbd: false, name: "Uruguay" },
  { code: "CZE", group_letter: "I", is_tbd: false, name: "Czech Republic" },
  { code: "UKR", group_letter: "I", is_tbd: false, name: "Ukraine" },
  { code: "TUR", group_letter: "I", is_tbd: false, name: "Turkey" },
  { code: "ITA", group_letter: "J", is_tbd: false, name: "Italy" },
  { code: "AUT", group_letter: "J", is_tbd: false, name: "Austria" },
  { code: "NOR", group_letter: "J", is_tbd: false, name: "Norway" },
  { code: "HUN", group_letter: "J", is_tbd: false, name: "Hungary" },
  { code: "CIV", group_letter: "K", is_tbd: false, name: "Ivory Coast" },
  { code: "CMR", group_letter: "K", is_tbd: false, name: "Cameroon" },
  { code: "DZA", group_letter: "K", is_tbd: false, name: "Algeria" },
  { code: "TBA", group_letter: "K", is_tbd: true, name: "TBD Group K Slot 4" },
  { code: "NZL", group_letter: "L", is_tbd: false, name: "New Zealand" },
  { code: "PAN", group_letter: "L", is_tbd: false, name: "Panama" },
  { code: "TBC", group_letter: "L", is_tbd: true, name: "TBD Group L Slot 3" },
  { code: "TBD", group_letter: "L", is_tbd: true, name: "TBD Group L Slot 4" },
] satisfies TeamDTO[];

const matches = [
  { away_team_code: "MEX", city: "Toronto", group_letter: "A", home_score: 1, home_team_code: "CAN", away_score: 1, kickoff: "2026-06-11T19:00:00Z", match_number: 1, phase: "GROUP_STAGE", status: "FINISHED", venue: "BMO Field" },
  { away_team_code: "CRC", city: "Los Angeles", group_letter: "A", home_score: 2, home_team_code: "USA", away_score: 0, kickoff: "2026-06-12T02:00:00Z", match_number: 2, phase: "GROUP_STAGE", status: "FINISHED", venue: "SoFi Stadium" },
  { away_team_code: "USA", city: "Vancouver", group_letter: "A", home_score: 0, home_team_code: "CAN", away_score: 2, kickoff: "2026-06-16T19:00:00Z", match_number: 3, phase: "GROUP_STAGE", status: "FINISHED", venue: "BC Place" },
  { away_team_code: "CRC", city: "Guadalajara", group_letter: "A", home_score: 3, home_team_code: "MEX", away_score: 1, kickoff: "2026-06-17T02:00:00Z", match_number: 4, phase: "GROUP_STAGE", status: "FINISHED", venue: "Estadio Akron" },
  { away_team_code: "CAN", city: "Arlington", group_letter: "A", home_score: 0, home_team_code: "CRC", away_score: 1, kickoff: "2026-06-21T19:00:00Z", match_number: 5, phase: "GROUP_STAGE", status: "FINISHED", venue: "AT&T Stadium" },
  { away_team_code: "USA", city: "Mexico City", group_letter: "A", home_score: 1, home_team_code: "MEX", away_score: 0, kickoff: "2026-06-21T19:00:00Z", match_number: 6, phase: "GROUP_STAGE", status: "FINISHED", venue: "Estadio Azteca" },
  { away_team_code: "CHL", city: "New York", group_letter: "B", home_score: 2, home_team_code: "ARG", away_score: 0, kickoff: "2026-06-12T19:00:00Z", match_number: 7, phase: "GROUP_STAGE", status: "FINISHED", venue: "MetLife Stadium" },
  { away_team_code: "VEN", city: "Houston", group_letter: "B", home_score: 1, home_team_code: "PER", away_score: 1, kickoff: "2026-06-13T02:00:00Z", match_number: 8, phase: "GROUP_STAGE", status: "FINISHED", venue: "NRG Stadium" },
  { away_team_code: "PER", city: "Philadelphia", group_letter: "B", home_score: 1, home_team_code: "ARG", away_score: 0, kickoff: "2026-06-17T19:00:00Z", match_number: 9, phase: "GROUP_STAGE", status: "FINISHED", venue: "Lincoln Financial Field" },
  { away_team_code: "VEN", city: "Miami Gardens", group_letter: "B", home_score: 2, home_team_code: "CHL", away_score: 1, kickoff: "2026-06-18T02:00:00Z", match_number: 10, phase: "GROUP_STAGE", status: "FINISHED", venue: "Hard Rock Stadium" },
  { away_team_code: "ARG", city: "Atlanta", group_letter: "B", home_score: 0, home_team_code: "VEN", away_score: 3, kickoff: "2026-06-22T19:00:00Z", match_number: 11, phase: "GROUP_STAGE", status: "FINISHED", venue: "Mercedes-Benz Stadium" },
  { away_team_code: "PER", city: "Seattle", group_letter: "B", home_score: 0, home_team_code: "CHL", away_score: 1, kickoff: "2026-06-22T19:00:00Z", match_number: 12, phase: "GROUP_STAGE", status: "FINISHED", venue: "Lumen Field" },
  { away_team_code: "COL", city: "Santa Clara", group_letter: "C", home_score: 2, home_team_code: "BRA", away_score: 1, kickoff: "2026-06-13T19:00:00Z", match_number: 13, phase: "GROUP_STAGE", status: "FINISHED", venue: "Levi's Stadium" },
  { away_team_code: "PRY", city: "Pasadena", group_letter: "C", home_score: 1, home_team_code: "ECU", away_score: 1, kickoff: "2026-06-14T02:00:00Z", match_number: 14, phase: "GROUP_STAGE", status: "LIVE", venue: "Rose Bowl Stadium" },
  { away_team_code: "ECU", city: "Foxborough", group_letter: "C", home_team_code: "BRA", kickoff: "2026-06-18T19:00:00Z", match_number: 15, phase: "GROUP_STAGE", status: "SCHEDULED", venue: "Gillette Stadium" },
  { away_team_code: "PRY", city: "Kansas City", group_letter: "C", home_team_code: "COL", kickoff: "2026-06-19T02:00:00Z", match_number: 16, phase: "GROUP_STAGE", status: "SCHEDULED", venue: "GEHA Field at Arrowhead" },
  { away_team_code: "BRA", city: "Orlando", group_letter: "C", home_team_code: "PRY", kickoff: "2026-06-23T19:00:00Z", match_number: 17, phase: "GROUP_STAGE", status: "SCHEDULED", venue: "Camping World Stadium" },
  { away_team_code: "ECU", city: "Glendale", group_letter: "C", home_team_code: "COL", kickoff: "2026-06-23T19:00:00Z", match_number: 18, phase: "GROUP_STAGE", status: "SCHEDULED", venue: "State Farm Stadium" },
  { away_team_code: "DEU", city: "Houston", group_letter: "D", home_team_code: "FRA", kickoff: "2026-06-14T19:00:00Z", match_number: 19, phase: "GROUP_STAGE", status: "SCHEDULED", venue: "NRG Stadium" },
  { away_team_code: "PRT", city: "Los Angeles", group_letter: "E", home_team_code: "ESP", kickoff: "2026-06-15T02:00:00Z", match_number: 20, phase: "GROUP_STAGE", status: "SCHEDULED", venue: "SoFi Stadium" },
  { away_team_code: "DNK", city: "Arlington", group_letter: "F", home_team_code: "BEL", kickoff: "2026-06-15T19:00:00Z", match_number: 21, phase: "GROUP_STAGE", status: "SCHEDULED", venue: "AT&T Stadium" },
  { away_team_code: "SEN", city: "Monterrey", group_letter: "G", home_team_code: "MAR", kickoff: "2026-06-16T02:00:00Z", match_number: 22, phase: "GROUP_STAGE", status: "SCHEDULED", venue: "Estadio BBVA" },
  { away_team_code: "KOR", city: "Seattle", group_letter: "H", home_team_code: "JPN", kickoff: "2026-06-16T19:00:00Z", match_number: 23, phase: "GROUP_STAGE", status: "SCHEDULED", venue: "Lumen Field" },
  { away_team_code: "CZE", city: "New York", group_letter: "I", home_team_code: "URY", kickoff: "2026-06-17T02:00:00Z", match_number: 24, phase: "GROUP_STAGE", status: "SCHEDULED", venue: "MetLife Stadium" },
  { away_team_code: "AUT", city: "Vancouver", group_letter: "J", home_team_code: "ITA", kickoff: "2026-06-17T19:00:00Z", match_number: 25, phase: "GROUP_STAGE", status: "SCHEDULED", venue: "BC Place" },
  { away_team_code: "CMR", city: "Atlanta", group_letter: "K", home_team_code: "CIV", kickoff: "2026-06-18T02:00:00Z", match_number: 26, phase: "GROUP_STAGE", status: "SCHEDULED", venue: "Mercedes-Benz Stadium" },
  { away_team_code: "PAN", city: "Toronto", group_letter: "L", home_team_code: "NZL", kickoff: "2026-06-18T19:00:00Z", match_number: 27, phase: "GROUP_STAGE", status: "SCHEDULED", venue: "BMO Field" },
  { away_team_code: "TBA", city: "Foxborough", group_letter: "K", home_team_code: "DZA", kickoff: "2026-06-22T02:00:00Z", match_number: 28, phase: "GROUP_STAGE", status: "SCHEDULED", venue: "Gillette Stadium" },
  { away_team_code: "TBD", city: "Vancouver", group_letter: "L", home_team_code: "TBC", kickoff: "2026-06-22T19:00:00Z", match_number: 29, phase: "GROUP_STAGE", status: "SCHEDULED", venue: "BC Place" },
  { away_placeholder: "Runner-up Group B", city: "Los Angeles", home_placeholder: "Winner Group A", kickoff: "2026-07-01T19:00:00Z", match_number: 30, phase: "ROUND_OF_32", status: "SCHEDULED", venue: "SoFi Stadium" },
  { away_placeholder: "Best Third Group B", city: "Houston", home_placeholder: "Winner Group C", kickoff: "2026-07-01T23:00:00Z", match_number: 31, phase: "ROUND_OF_32", status: "SCHEDULED", venue: "NRG Stadium" },
  { away_placeholder: "Winner Match 31", city: "New York", home_placeholder: "Winner Match 30", kickoff: "2026-07-05T19:00:00Z", match_number: 32, phase: "ROUND_OF_16", status: "SCHEDULED", venue: "MetLife Stadium" },
  { away_placeholder: "Winner Round of 16 Slot 2", city: "Santa Clara", home_placeholder: "Winner Round of 16 Slot 1", kickoff: "2026-07-09T19:00:00Z", match_number: 33, phase: "QUARTER_FINALS", status: "SCHEDULED", venue: "Levi's Stadium" },
  { away_placeholder: "Winner Quarter-final Slot 2", city: "Atlanta", home_placeholder: "Winner Quarter-final Slot 1", kickoff: "2026-07-13T19:00:00Z", match_number: 34, phase: "SEMI_FINALS", status: "SCHEDULED", venue: "Mercedes-Benz Stadium" },
  { away_placeholder: "Semi-final Loser 2", city: "Miami Gardens", home_placeholder: "Semi-final Loser 1", kickoff: "2026-07-17T19:00:00Z", match_number: 35, phase: "THIRD_PLACE", status: "SCHEDULED", venue: "Hard Rock Stadium" },
  { away_placeholder: "Semi-final Winner 2", city: "New York", home_placeholder: "Semi-final Winner 1", kickoff: "2026-07-19T19:00:00Z", match_number: 36, phase: "FINAL", status: "SCHEDULED", venue: "MetLife Stadium" },
] satisfies MatchDTO[];

const standings = [
  { goals_against: 2, goals_for: 5, goal_difference: 3, group_letter: "A", is_final: true, lost: 0, played: 3, points: 7, position: 1, qualification_status: "QUALIFIED_FIRST", team_code: "MEX", won: 2, drawn: 1 },
  { goals_against: 2, goals_for: 4, goal_difference: 2, group_letter: "A", is_final: true, lost: 1, played: 3, points: 6, position: 2, qualification_status: "QUALIFIED_SECOND", team_code: "USA", won: 2, drawn: 0 },
  { goals_against: 2, goals_for: 2, goal_difference: 0, group_letter: "A", is_final: true, lost: 1, played: 3, points: 4, position: 3, qualification_status: "ELIMINATED", team_code: "CAN", won: 1, drawn: 1 },
  { goals_against: 6, goals_for: 1, goal_difference: -5, group_letter: "A", is_final: true, lost: 3, played: 3, points: 0, position: 4, qualification_status: "ELIMINATED", team_code: "CRC", won: 0, drawn: 0 },
  { goals_against: 0, goals_for: 6, goal_difference: 6, group_letter: "B", is_final: true, lost: 0, played: 3, points: 9, position: 1, qualification_status: "QUALIFIED_FIRST", team_code: "ARG", won: 3, drawn: 0 },
  { goals_against: 2, goals_for: 2, goal_difference: 0, group_letter: "B", is_final: true, lost: 1, played: 3, points: 4, position: 2, qualification_status: "QUALIFIED_SECOND", team_code: "PER", won: 1, drawn: 1 },
  { goals_against: 3, goals_for: 2, goal_difference: -1, group_letter: "B", is_final: true, lost: 2, played: 3, points: 3, position: 3, qualification_status: "BEST_THIRD", team_code: "CHL", won: 1, drawn: 0 },
  { goals_against: 5, goals_for: 2, goal_difference: -3, group_letter: "B", is_final: true, lost: 2, played: 3, points: 1, position: 4, qualification_status: "ELIMINATED", team_code: "VEN", won: 0, drawn: 1 },
  { goals_against: 1, goals_for: 2, goal_difference: 1, group_letter: "C", is_final: false, lost: 0, played: 1, points: 3, position: 1, team_code: "BRA", won: 1, drawn: 0 },
  { goals_against: 1, goals_for: 1, goal_difference: 0, group_letter: "C", is_final: false, lost: 0, played: 1, points: 1, position: 2, team_code: "ECU", won: 0, drawn: 1 },
  { goals_against: 1, goals_for: 1, goal_difference: 0, group_letter: "C", is_final: false, lost: 0, played: 1, points: 1, position: 3, team_code: "PRY", won: 0, drawn: 1 },
  { goals_against: 2, goals_for: 1, goal_difference: -1, group_letter: "C", is_final: false, lost: 1, played: 1, points: 0, position: 4, team_code: "COL", won: 0, drawn: 0 },
] satisfies GroupStandingDTO[];

function cloneList<T extends Record<string, unknown>>(items: T[]) {
  return items.map((item) => ({ ...item }));
}

export class MockWorldCupProvider implements WorldCupProvider {
  async getMatches() {
    return cloneList(matches);
  }

  async getStandings() {
    return cloneList(standings);
  }

  async getTeams() {
    return cloneList(teams);
  }
}
