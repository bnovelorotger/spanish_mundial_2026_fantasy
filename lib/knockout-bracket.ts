import type { GroupLetter, MatchStatus, WinnerSide } from "@/lib/types/worldcup";

export type BestThirdSlotKey = "A" | "B" | "D" | "E" | "G" | "I" | "K" | "L";

export interface KnockoutSeedTeam {
  code: string;
  flag_url: string | null;
  id: string;
  is_tbd: boolean;
  name: string;
}

export interface KnockoutSeedStandingRow {
  goal_difference: number;
  goals_for: number;
  group_letter: GroupLetter;
  is_final: boolean;
  played: number;
  points: number;
  position: number;
  team: KnockoutSeedTeam | null;
  team_id: string;
}

export interface KnockoutSeedMatchRow {
  away_team: KnockoutSeedTeam | null;
  home_team: KnockoutSeedTeam | null;
  match_number: number;
  status: MatchStatus;
  winner_side: WinnerSide | null;
}

export interface GroupSeedSpec {
  groupLetter: GroupLetter;
  kind: "GROUP_POSITION";
  position: 1 | 2;
}

export interface BestThirdSeedSpec {
  allowedGroups: GroupLetter[];
  kind: "BEST_THIRD";
  slotKey: BestThirdSlotKey;
}

export interface WinnerOfMatchSeedSpec {
  kind: "WINNER_OF_MATCH";
  matchNumber: number;
}

export type BracketSeedSpec =
  | GroupSeedSpec
  | BestThirdSeedSpec
  | WinnerOfMatchSeedSpec;

const MAX_GROUP_STAGE_MATCHES = 3;
const BEST_THIRD_SLOT_KEYS: BestThirdSlotKey[] = [
  "A",
  "B",
  "D",
  "E",
  "G",
  "I",
  "K",
  "L",
];

const BEST_THIRD_COMBINATIONS_RAW = `E,F,G,H,I,J,K,L|E,J,I,F,H,G,L,K
D,F,G,H,I,J,K,L|H,G,I,D,J,F,L,K
D,E,G,H,I,J,K,L|E,J,I,D,H,G,L,K
D,E,F,H,I,J,K,L|E,J,I,D,H,F,L,K
D,E,F,G,I,J,K,L|E,G,I,D,J,F,L,K
D,E,F,G,H,J,K,L|E,G,J,D,H,F,L,K
D,E,F,G,H,I,K,L|E,G,I,D,H,F,L,K
D,E,F,G,H,I,J,L|E,G,J,D,H,F,L,I
D,E,F,G,H,I,J,K|E,G,J,D,H,F,I,K
C,F,G,H,I,J,K,L|H,G,I,C,J,F,L,K
C,E,G,H,I,J,K,L|E,J,I,C,H,G,L,K
C,E,F,H,I,J,K,L|E,J,I,C,H,F,L,K
C,E,F,G,I,J,K,L|E,G,I,C,J,F,L,K
C,E,F,G,H,J,K,L|E,G,J,C,H,F,L,K
C,E,F,G,H,I,K,L|E,G,I,C,H,F,L,K
C,E,F,G,H,I,J,L|E,G,J,C,H,F,L,I
C,E,F,G,H,I,J,K|E,G,J,C,H,F,I,K
C,D,G,H,I,J,K,L|H,G,I,C,J,D,L,K
C,D,F,H,I,J,K,L|C,J,I,D,H,F,L,K
C,D,F,G,I,J,K,L|C,G,I,D,J,F,L,K
C,D,F,G,H,J,K,L|C,G,J,D,H,F,L,K
C,D,F,G,H,I,K,L|C,G,I,D,H,F,L,K
C,D,F,G,H,I,J,L|C,G,J,D,H,F,L,I
C,D,F,G,H,I,J,K|C,G,J,D,H,F,I,K
C,D,E,H,I,J,K,L|E,J,I,C,H,D,L,K
C,D,E,G,I,J,K,L|E,G,I,C,J,D,L,K
C,D,E,G,H,J,K,L|E,G,J,C,H,D,L,K
C,D,E,G,H,I,K,L|E,G,I,C,H,D,L,K
C,D,E,G,H,I,J,L|E,G,J,C,H,D,L,I
C,D,E,G,H,I,J,K|E,G,J,C,H,D,I,K
C,D,E,F,I,J,K,L|C,J,E,D,I,F,L,K
C,D,E,F,H,J,K,L|C,J,E,D,H,F,L,K
C,D,E,F,H,I,K,L|C,E,I,D,H,F,L,K
C,D,E,F,H,I,J,L|C,J,E,D,H,F,L,I
C,D,E,F,H,I,J,K|C,J,E,D,H,F,I,K
C,D,E,F,G,J,K,L|C,G,E,D,J,F,L,K
C,D,E,F,G,I,K,L|C,G,E,D,I,F,L,K
C,D,E,F,G,I,J,L|C,G,E,D,J,F,L,I
C,D,E,F,G,I,J,K|C,G,E,D,J,F,I,K
C,D,E,F,G,H,K,L|C,G,E,D,H,F,L,K
C,D,E,F,G,H,J,L|C,G,J,D,H,F,L,E
C,D,E,F,G,H,J,K|C,G,J,D,H,F,E,K
C,D,E,F,G,H,I,L|C,G,E,D,H,F,L,I
C,D,E,F,G,H,I,K|C,G,E,D,H,F,I,K
C,D,E,F,G,H,I,J|C,G,J,D,H,F,E,I
B,F,G,H,I,J,K,L|H,J,B,F,I,G,L,K
B,E,G,H,I,J,K,L|E,J,I,B,H,G,L,K
B,E,F,H,I,J,K,L|E,J,B,F,I,H,L,K
B,E,F,G,I,J,K,L|E,J,B,F,I,G,L,K
B,E,F,G,H,J,K,L|E,J,B,F,H,G,L,K
B,E,F,G,H,I,K,L|E,G,B,F,I,H,L,K
B,E,F,G,H,I,J,L|E,J,B,F,H,G,L,I
B,E,F,G,H,I,J,K|E,J,B,F,H,G,I,K
B,D,G,H,I,J,K,L|H,J,B,D,I,G,L,K
B,D,F,H,I,J,K,L|H,J,B,D,I,F,L,K
B,D,F,G,I,J,K,L|I,G,B,D,J,F,L,K
B,D,F,G,H,J,K,L|H,G,B,D,J,F,L,K
B,D,F,G,H,I,K,L|H,G,B,D,I,F,L,K
B,D,F,G,H,I,J,L|H,G,B,D,J,F,L,I
B,D,F,G,H,I,J,K|H,G,B,D,J,F,I,K
B,D,E,H,I,J,K,L|E,J,B,D,I,H,L,K
B,D,E,G,I,J,K,L|E,J,B,D,I,G,L,K
B,D,E,G,H,J,K,L|E,J,B,D,H,G,L,K
B,D,E,G,H,I,K,L|E,G,B,D,I,H,L,K
B,D,E,G,H,I,J,L|E,J,B,D,H,G,L,I
B,D,E,G,H,I,J,K|E,J,B,D,H,G,I,K
B,D,E,F,I,J,K,L|E,J,B,D,I,F,L,K
B,D,E,F,H,J,K,L|E,J,B,D,H,F,L,K
B,D,E,F,H,I,K,L|E,I,B,D,H,F,L,K
B,D,E,F,H,I,J,L|E,J,B,D,H,F,L,I
B,D,E,F,H,I,J,K|E,J,B,D,H,F,I,K
B,D,E,F,G,J,K,L|E,G,B,D,J,F,L,K
B,D,E,F,G,I,K,L|E,G,B,D,I,F,L,K
B,D,E,F,G,I,J,L|E,G,B,D,J,F,L,I
B,D,E,F,G,I,J,K|E,G,B,D,J,F,I,K
B,D,E,F,G,H,K,L|E,G,B,D,H,F,L,K
B,D,E,F,G,H,J,L|H,G,B,D,J,F,L,E
B,D,E,F,G,H,J,K|H,G,B,D,J,F,E,K
B,D,E,F,G,H,I,L|E,G,B,D,H,F,L,I
B,D,E,F,G,H,I,K|E,G,B,D,H,F,I,K
B,D,E,F,G,H,I,J|H,G,B,D,J,F,E,I
B,C,G,H,I,J,K,L|H,J,B,C,I,G,L,K
B,C,F,H,I,J,K,L|H,J,B,C,I,F,L,K
B,C,F,G,I,J,K,L|I,G,B,C,J,F,L,K
B,C,F,G,H,J,K,L|H,G,B,C,J,F,L,K
B,C,F,G,H,I,K,L|H,G,B,C,I,F,L,K
B,C,F,G,H,I,J,L|H,G,B,C,J,F,L,I
B,C,F,G,H,I,J,K|H,G,B,C,J,F,I,K
B,C,E,H,I,J,K,L|E,J,B,C,I,H,L,K
B,C,E,G,I,J,K,L|E,J,B,C,I,G,L,K
B,C,E,G,H,J,K,L|E,J,B,C,H,G,L,K
B,C,E,G,H,I,K,L|E,G,B,C,I,H,L,K
B,C,E,G,H,I,J,L|E,J,B,C,H,G,L,I
B,C,E,G,H,I,J,K|E,J,B,C,H,G,I,K
B,C,E,F,I,J,K,L|E,J,B,C,I,F,L,K
B,C,E,F,H,J,K,L|E,J,B,C,H,F,L,K
B,C,E,F,H,I,K,L|E,I,B,C,H,F,L,K
B,C,E,F,H,I,J,L|E,J,B,C,H,F,L,I
B,C,E,F,H,I,J,K|E,J,B,C,H,F,I,K
B,C,E,F,G,J,K,L|E,G,B,C,J,F,L,K
B,C,E,F,G,I,K,L|E,G,B,C,I,F,L,K
B,C,E,F,G,I,J,L|E,G,B,C,J,F,L,I
B,C,E,F,G,I,J,K|E,G,B,C,J,F,I,K
B,C,E,F,G,H,K,L|E,G,B,C,H,F,L,K
B,C,E,F,G,H,J,L|H,G,B,C,J,F,L,E
B,C,E,F,G,H,J,K|H,G,B,C,J,F,E,K
B,C,E,F,G,H,I,L|E,G,B,C,H,F,L,I
B,C,E,F,G,H,I,K|E,G,B,C,H,F,I,K
B,C,E,F,G,H,I,J|H,G,B,C,J,F,E,I
B,C,D,H,I,J,K,L|H,J,B,C,I,D,L,K
B,C,D,G,I,J,K,L|I,G,B,C,J,D,L,K
B,C,D,G,H,J,K,L|H,G,B,C,J,D,L,K
B,C,D,G,H,I,K,L|H,G,B,C,I,D,L,K
B,C,D,G,H,I,J,L|H,G,B,C,J,D,L,I
B,C,D,G,H,I,J,K|H,G,B,C,J,D,I,K
B,C,D,F,I,J,K,L|C,J,B,D,I,F,L,K
B,C,D,F,H,J,K,L|C,J,B,D,H,F,L,K
B,C,D,F,H,I,K,L|C,I,B,D,H,F,L,K
B,C,D,F,H,I,J,L|C,J,B,D,H,F,L,I
B,C,D,F,H,I,J,K|C,J,B,D,H,F,I,K
B,C,D,F,G,J,K,L|C,G,B,D,J,F,L,K
B,C,D,F,G,I,K,L|C,G,B,D,I,F,L,K
B,C,D,F,G,I,J,L|C,G,B,D,J,F,L,I
B,C,D,F,G,I,J,K|C,G,B,D,J,F,I,K
B,C,D,F,G,H,K,L|C,G,B,D,H,F,L,K
B,C,D,F,G,H,J,L|C,G,B,D,H,F,L,J
B,C,D,F,G,H,J,K|H,G,B,C,J,F,D,K
B,C,D,F,G,H,I,L|C,G,B,D,H,F,L,I
B,C,D,F,G,H,I,K|C,G,B,D,H,F,I,K
B,C,D,F,G,H,I,J|H,G,B,C,J,F,D,I
B,C,D,E,I,J,K,L|E,J,B,C,I,D,L,K
B,C,D,E,H,J,K,L|E,J,B,C,H,D,L,K
B,C,D,E,H,I,K,L|E,I,B,C,H,D,L,K
B,C,D,E,H,I,J,L|E,J,B,C,H,D,L,I
B,C,D,E,H,I,J,K|E,J,B,C,H,D,I,K
B,C,D,E,G,J,K,L|E,G,B,C,J,D,L,K
B,C,D,E,G,I,K,L|E,G,B,C,I,D,L,K
B,C,D,E,G,I,J,L|E,G,B,C,J,D,L,I
B,C,D,E,G,I,J,K|E,G,B,C,J,D,I,K
B,C,D,E,G,H,K,L|E,G,B,C,H,D,L,K
B,C,D,E,G,H,J,L|H,G,B,C,J,D,L,E
B,C,D,E,G,H,J,K|H,G,B,C,J,D,E,K
B,C,D,E,G,H,I,L|E,G,B,C,H,D,L,I
B,C,D,E,G,H,I,K|E,G,B,C,H,D,I,K
B,C,D,E,G,H,I,J|H,G,B,C,J,D,E,I
B,C,D,E,F,J,K,L|C,J,B,D,E,F,L,K
B,C,D,E,F,I,K,L|C,E,B,D,I,F,L,K
B,C,D,E,F,I,J,L|C,J,B,D,E,F,L,I
B,C,D,E,F,I,J,K|C,J,B,D,E,F,I,K
B,C,D,E,F,H,K,L|C,E,B,D,H,F,L,K
B,C,D,E,F,H,J,L|C,J,B,D,H,F,L,E
B,C,D,E,F,H,J,K|C,J,B,D,H,F,E,K
B,C,D,E,F,H,I,L|C,E,B,D,H,F,L,I
B,C,D,E,F,H,I,K|C,E,B,D,H,F,I,K
B,C,D,E,F,H,I,J|C,J,B,D,H,F,E,I
B,C,D,E,F,G,K,L|C,G,B,D,E,F,L,K
B,C,D,E,F,G,J,L|C,G,B,D,J,F,L,E
B,C,D,E,F,G,J,K|C,G,B,D,J,F,E,K
B,C,D,E,F,G,I,L|C,G,B,D,E,F,L,I
B,C,D,E,F,G,I,K|C,G,B,D,E,F,I,K
B,C,D,E,F,G,I,J|C,G,B,D,J,F,E,I
B,C,D,E,F,G,H,L|C,G,B,D,H,F,L,E
B,C,D,E,F,G,H,K|C,G,B,D,H,F,E,K
B,C,D,E,F,G,H,J|H,G,B,C,J,F,D,E
B,C,D,E,F,G,H,I|C,G,B,D,H,F,E,I
A,F,G,H,I,J,K,L|H,J,I,F,A,G,L,K
A,E,G,H,I,J,K,L|E,J,I,A,H,G,L,K
A,E,F,H,I,J,K,L|E,J,I,F,A,H,L,K
A,E,F,G,I,J,K,L|E,J,I,F,A,G,L,K
A,E,F,G,H,J,K,L|E,G,J,F,A,H,L,K
A,E,F,G,H,I,K,L|E,G,I,F,A,H,L,K
A,E,F,G,H,I,J,L|E,G,J,F,A,H,L,I
A,E,F,G,H,I,J,K|E,G,J,F,A,H,I,K
A,D,G,H,I,J,K,L|H,J,I,D,A,G,L,K
A,D,F,H,I,J,K,L|H,J,I,D,A,F,L,K
A,D,F,G,I,J,K,L|I,G,J,D,A,F,L,K
A,D,F,G,H,J,K,L|H,G,J,D,A,F,L,K
A,D,F,G,H,I,K,L|H,G,I,D,A,F,L,K
A,D,F,G,H,I,J,L|H,G,J,D,A,F,L,I
A,D,F,G,H,I,J,K|H,G,J,D,A,F,I,K
A,D,E,H,I,J,K,L|E,J,I,D,A,H,L,K
A,D,E,G,I,J,K,L|E,J,I,D,A,G,L,K
A,D,E,G,H,J,K,L|E,G,J,D,A,H,L,K
A,D,E,G,H,I,K,L|E,G,I,D,A,H,L,K
A,D,E,G,H,I,J,L|E,G,J,D,A,H,L,I
A,D,E,G,H,I,J,K|E,G,J,D,A,H,I,K
A,D,E,F,I,J,K,L|E,J,I,D,A,F,L,K
A,D,E,F,H,J,K,L|H,J,E,D,A,F,L,K
A,D,E,F,H,I,K,L|H,E,I,D,A,F,L,K
A,D,E,F,H,I,J,L|H,J,E,D,A,F,L,I
A,D,E,F,H,I,J,K|H,J,E,D,A,F,I,K
A,D,E,F,G,J,K,L|E,G,J,D,A,F,L,K
A,D,E,F,G,I,K,L|E,G,I,D,A,F,L,K
A,D,E,F,G,I,J,L|E,G,J,D,A,F,L,I
A,D,E,F,G,I,J,K|E,G,J,D,A,F,I,K
A,D,E,F,G,H,K,L|H,G,E,D,A,F,L,K
A,D,E,F,G,H,J,L|H,G,J,D,A,F,L,E
A,D,E,F,G,H,J,K|H,G,J,D,A,F,E,K
A,D,E,F,G,H,I,L|H,G,E,D,A,F,L,I
A,D,E,F,G,H,I,K|H,G,E,D,A,F,I,K
A,D,E,F,G,H,I,J|H,G,J,D,A,F,E,I
A,C,G,H,I,J,K,L|H,J,I,C,A,G,L,K
A,C,F,H,I,J,K,L|H,J,I,C,A,F,L,K
A,C,F,G,I,J,K,L|I,G,J,C,A,F,L,K
A,C,F,G,H,J,K,L|H,G,J,C,A,F,L,K
A,C,F,G,H,I,K,L|H,G,I,C,A,F,L,K
A,C,F,G,H,I,J,L|H,G,J,C,A,F,L,I
A,C,F,G,H,I,J,K|H,G,J,C,A,F,I,K
A,C,E,H,I,J,K,L|E,J,I,C,A,H,L,K
A,C,E,G,I,J,K,L|E,J,I,C,A,G,L,K
A,C,E,G,H,J,K,L|E,G,J,C,A,H,L,K
A,C,E,G,H,I,K,L|E,G,I,C,A,H,L,K
A,C,E,G,H,I,J,L|E,G,J,C,A,H,L,I
A,C,E,G,H,I,J,K|E,G,J,C,A,H,I,K
A,C,E,F,I,J,K,L|E,J,I,C,A,F,L,K
A,C,E,F,H,J,K,L|H,J,E,C,A,F,L,K
A,C,E,F,H,I,K,L|H,E,I,C,A,F,L,K
A,C,E,F,H,I,J,L|H,J,E,C,A,F,L,I
A,C,E,F,H,I,J,K|H,J,E,C,A,F,I,K
A,C,E,F,G,J,K,L|E,G,J,C,A,F,L,K
A,C,E,F,G,I,K,L|E,G,I,C,A,F,L,K
A,C,E,F,G,I,J,L|E,G,J,C,A,F,L,I
A,C,E,F,G,I,J,K|E,G,J,C,A,F,I,K
A,C,E,F,G,H,K,L|H,G,E,C,A,F,L,K
A,C,E,F,G,H,J,L|H,G,J,C,A,F,L,E
A,C,E,F,G,H,J,K|H,G,J,C,A,F,E,K
A,C,E,F,G,H,I,L|H,G,E,C,A,F,L,I
A,C,E,F,G,H,I,K|H,G,E,C,A,F,I,K
A,C,E,F,G,H,I,J|H,G,J,C,A,F,E,I
A,C,D,H,I,J,K,L|H,J,I,C,A,D,L,K
A,C,D,G,I,J,K,L|I,G,J,C,A,D,L,K
A,C,D,G,H,J,K,L|H,G,J,C,A,D,L,K
A,C,D,G,H,I,K,L|H,G,I,C,A,D,L,K
A,C,D,G,H,I,J,L|H,G,J,C,A,D,L,I
A,C,D,G,H,I,J,K|H,G,J,C,A,D,I,K
A,C,D,F,I,J,K,L|C,J,I,D,A,F,L,K
A,C,D,F,H,J,K,L|H,J,F,C,A,D,L,K
A,C,D,F,H,I,K,L|H,F,I,C,A,D,L,K
A,C,D,F,H,I,J,L|H,J,F,C,A,D,L,I
A,C,D,F,H,I,J,K|H,J,F,C,A,D,I,K
A,C,D,F,G,J,K,L|C,G,J,D,A,F,L,K
A,C,D,F,G,I,K,L|C,G,I,D,A,F,L,K
A,C,D,F,G,I,J,L|C,G,J,D,A,F,L,I
A,C,D,F,G,I,J,K|C,G,J,D,A,F,I,K
A,C,D,F,G,H,K,L|H,G,F,C,A,D,L,K
A,C,D,F,G,H,J,L|C,G,J,D,A,F,L,H
A,C,D,F,G,H,J,K|H,G,J,C,A,F,D,K
A,C,D,F,G,H,I,L|H,G,F,C,A,D,L,I
A,C,D,F,G,H,I,K|H,G,F,C,A,D,I,K
A,C,D,F,G,H,I,J|H,G,J,C,A,F,D,I
A,C,D,E,I,J,K,L|E,J,I,C,A,D,L,K
A,C,D,E,H,J,K,L|H,J,E,C,A,D,L,K
A,C,D,E,H,I,K,L|H,E,I,C,A,D,L,K
A,C,D,E,H,I,J,L|H,J,E,C,A,D,L,I
A,C,D,E,H,I,J,K|H,J,E,C,A,D,I,K
A,C,D,E,G,J,K,L|E,G,J,C,A,D,L,K
A,C,D,E,G,I,K,L|E,G,I,C,A,D,L,K
A,C,D,E,G,I,J,L|E,G,J,C,A,D,L,I
A,C,D,E,G,I,J,K|E,G,J,C,A,D,I,K
A,C,D,E,G,H,K,L|H,G,E,C,A,D,L,K
A,C,D,E,G,H,J,L|H,G,J,C,A,D,L,E
A,C,D,E,G,H,J,K|H,G,J,C,A,D,E,K
A,C,D,E,G,H,I,L|H,G,E,C,A,D,L,I
A,C,D,E,G,H,I,K|H,G,E,C,A,D,I,K
A,C,D,E,G,H,I,J|H,G,J,C,A,D,E,I
A,C,D,E,F,J,K,L|C,J,E,D,A,F,L,K
A,C,D,E,F,I,K,L|C,E,I,D,A,F,L,K
A,C,D,E,F,I,J,L|C,J,E,D,A,F,L,I
A,C,D,E,F,I,J,K|C,J,E,D,A,F,I,K
A,C,D,E,F,H,K,L|H,E,F,C,A,D,L,K
A,C,D,E,F,H,J,L|H,J,F,C,A,D,L,E
A,C,D,E,F,H,J,K|H,J,E,C,A,F,D,K
A,C,D,E,F,H,I,L|H,E,F,C,A,D,L,I
A,C,D,E,F,H,I,K|H,E,F,C,A,D,I,K
A,C,D,E,F,H,I,J|H,J,E,C,A,F,D,I
A,C,D,E,F,G,K,L|C,G,E,D,A,F,L,K
A,C,D,E,F,G,J,L|C,G,J,D,A,F,L,E
A,C,D,E,F,G,J,K|C,G,J,D,A,F,E,K
A,C,D,E,F,G,I,L|C,G,E,D,A,F,L,I
A,C,D,E,F,G,I,K|C,G,E,D,A,F,I,K
A,C,D,E,F,G,I,J|C,G,J,D,A,F,E,I
A,C,D,E,F,G,H,L|H,G,F,C,A,D,L,E
A,C,D,E,F,G,H,K|H,G,E,C,A,F,D,K
A,C,D,E,F,G,H,J|H,G,J,C,A,F,D,E
A,C,D,E,F,G,H,I|H,G,E,C,A,F,D,I
A,B,G,H,I,J,K,L|H,J,B,A,I,G,L,K
A,B,F,H,I,J,K,L|H,J,B,A,I,F,L,K
A,B,F,G,I,J,K,L|I,J,B,F,A,G,L,K
A,B,F,G,H,J,K,L|H,J,B,F,A,G,L,K
A,B,F,G,H,I,K,L|H,G,B,A,I,F,L,K
A,B,F,G,H,I,J,L|H,J,B,F,A,G,L,I
A,B,F,G,H,I,J,K|H,J,B,F,A,G,I,K
A,B,E,H,I,J,K,L|E,J,B,A,I,H,L,K
A,B,E,G,I,J,K,L|E,J,B,A,I,G,L,K
A,B,E,G,H,J,K,L|E,J,B,A,H,G,L,K
A,B,E,G,H,I,K,L|E,G,B,A,I,H,L,K
A,B,E,G,H,I,J,L|E,J,B,A,H,G,L,I
A,B,E,G,H,I,J,K|E,J,B,A,H,G,I,K
A,B,E,F,I,J,K,L|E,J,B,A,I,F,L,K
A,B,E,F,H,J,K,L|E,J,B,F,A,H,L,K
A,B,E,F,H,I,K,L|E,I,B,F,A,H,L,K
A,B,E,F,H,I,J,L|E,J,B,F,A,H,L,I
A,B,E,F,H,I,J,K|E,J,B,F,A,H,I,K
A,B,E,F,G,J,K,L|E,J,B,F,A,G,L,K
A,B,E,F,G,I,K,L|E,G,B,A,I,F,L,K
A,B,E,F,G,I,J,L|E,J,B,F,A,G,L,I
A,B,E,F,G,I,J,K|E,J,B,F,A,G,I,K
A,B,E,F,G,H,K,L|E,G,B,F,A,H,L,K
A,B,E,F,G,H,J,L|H,J,B,F,A,G,L,E
A,B,E,F,G,H,J,K|H,J,B,F,A,G,E,K
A,B,E,F,G,H,I,L|E,G,B,F,A,H,L,I
A,B,E,F,G,H,I,K|E,G,B,F,A,H,I,K
A,B,E,F,G,H,I,J|H,J,B,F,A,G,E,I
A,B,D,H,I,J,K,L|I,J,B,D,A,H,L,K
A,B,D,G,I,J,K,L|I,J,B,D,A,G,L,K
A,B,D,G,H,J,K,L|H,J,B,D,A,G,L,K
A,B,D,G,H,I,K,L|I,G,B,D,A,H,L,K
A,B,D,G,H,I,J,L|H,J,B,D,A,G,L,I
A,B,D,G,H,I,J,K|H,J,B,D,A,G,I,K
A,B,D,F,I,J,K,L|I,J,B,D,A,F,L,K
A,B,D,F,H,J,K,L|H,J,B,D,A,F,L,K
A,B,D,F,H,I,K,L|H,I,B,D,A,F,L,K
A,B,D,F,H,I,J,L|H,J,B,D,A,F,L,I
A,B,D,F,H,I,J,K|H,J,B,D,A,F,I,K
A,B,D,F,G,J,K,L|F,J,B,D,A,G,L,K
A,B,D,F,G,I,K,L|I,G,B,D,A,F,L,K
A,B,D,F,G,I,J,L|F,J,B,D,A,G,L,I
A,B,D,F,G,I,J,K|F,J,B,D,A,G,I,K
A,B,D,F,G,H,K,L|H,G,B,D,A,F,L,K
A,B,D,F,G,H,J,L|H,G,B,D,A,F,L,J
A,B,D,F,G,H,J,K|H,G,B,D,A,F,J,K
A,B,D,F,G,H,I,L|H,G,B,D,A,F,L,I
A,B,D,F,G,H,I,K|H,G,B,D,A,F,I,K
A,B,D,F,G,H,I,J|H,G,B,D,A,F,I,J
A,B,D,E,I,J,K,L|E,J,B,A,I,D,L,K
A,B,D,E,H,J,K,L|E,J,B,D,A,H,L,K
A,B,D,E,H,I,K,L|E,I,B,D,A,H,L,K
A,B,D,E,H,I,J,L|E,J,B,D,A,H,L,I
A,B,D,E,H,I,J,K|E,J,B,D,A,H,I,K
A,B,D,E,G,J,K,L|E,J,B,D,A,G,L,K
A,B,D,E,G,I,K,L|E,G,B,A,I,D,L,K
A,B,D,E,G,I,J,L|E,J,B,D,A,G,L,I
A,B,D,E,G,I,J,K|E,J,B,D,A,G,I,K
A,B,D,E,G,H,K,L|E,G,B,D,A,H,L,K
A,B,D,E,G,H,J,L|H,J,B,D,A,G,L,E
A,B,D,E,G,H,J,K|H,J,B,D,A,G,E,K
A,B,D,E,G,H,I,L|E,G,B,D,A,H,L,I
A,B,D,E,G,H,I,K|E,G,B,D,A,H,I,K
A,B,D,E,G,H,I,J|H,J,B,D,A,G,E,I
A,B,D,E,F,J,K,L|E,J,B,D,A,F,L,K
A,B,D,E,F,I,K,L|E,I,B,D,A,F,L,K
A,B,D,E,F,I,J,L|E,J,B,D,A,F,L,I
A,B,D,E,F,I,J,K|E,J,B,D,A,F,I,K
A,B,D,E,F,H,K,L|H,E,B,D,A,F,L,K
A,B,D,E,F,H,J,L|H,J,B,D,A,F,L,E
A,B,D,E,F,H,J,K|H,J,B,D,A,F,E,K
A,B,D,E,F,H,I,L|H,E,B,D,A,F,L,I
A,B,D,E,F,H,I,K|H,E,B,D,A,F,I,K
A,B,D,E,F,H,I,J|H,J,B,D,A,F,E,I
A,B,D,E,F,G,K,L|E,G,B,D,A,F,L,K
A,B,D,E,F,G,J,L|E,G,B,D,A,F,L,J
A,B,D,E,F,G,J,K|E,G,B,D,A,F,J,K
A,B,D,E,F,G,I,L|E,G,B,D,A,F,L,I
A,B,D,E,F,G,I,K|E,G,B,D,A,F,I,K
A,B,D,E,F,G,I,J|E,G,B,D,A,F,I,J
A,B,D,E,F,G,H,L|H,G,B,D,A,F,L,E
A,B,D,E,F,G,H,K|H,G,B,D,A,F,E,K
A,B,D,E,F,G,H,J|H,G,B,D,A,F,E,J
A,B,D,E,F,G,H,I|H,G,B,D,A,F,E,I
A,B,C,H,I,J,K,L|I,J,B,C,A,H,L,K
A,B,C,G,I,J,K,L|I,J,B,C,A,G,L,K
A,B,C,G,H,J,K,L|H,J,B,C,A,G,L,K
A,B,C,G,H,I,K,L|I,G,B,C,A,H,L,K
A,B,C,G,H,I,J,L|H,J,B,C,A,G,L,I
A,B,C,G,H,I,J,K|H,J,B,C,A,G,I,K
A,B,C,F,I,J,K,L|I,J,B,C,A,F,L,K
A,B,C,F,H,J,K,L|H,J,B,C,A,F,L,K
A,B,C,F,H,I,K,L|H,I,B,C,A,F,L,K
A,B,C,F,H,I,J,L|H,J,B,C,A,F,L,I
A,B,C,F,H,I,J,K|H,J,B,C,A,F,I,K
A,B,C,F,G,J,K,L|C,J,B,F,A,G,L,K
A,B,C,F,G,I,K,L|I,G,B,C,A,F,L,K
A,B,C,F,G,I,J,L|C,J,B,F,A,G,L,I
A,B,C,F,G,I,J,K|C,J,B,F,A,G,I,K
A,B,C,F,G,H,K,L|H,G,B,C,A,F,L,K
A,B,C,F,G,H,J,L|H,G,B,C,A,F,L,J
A,B,C,F,G,H,J,K|H,G,B,C,A,F,J,K
A,B,C,F,G,H,I,L|H,G,B,C,A,F,L,I
A,B,C,F,G,H,I,K|H,G,B,C,A,F,I,K
A,B,C,F,G,H,I,J|H,G,B,C,A,F,I,J
A,B,C,E,I,J,K,L|E,J,B,A,I,C,L,K
A,B,C,E,H,J,K,L|E,J,B,C,A,H,L,K
A,B,C,E,H,I,K,L|E,I,B,C,A,H,L,K
A,B,C,E,H,I,J,L|E,J,B,C,A,H,L,I
A,B,C,E,H,I,J,K|E,J,B,C,A,H,I,K
A,B,C,E,G,J,K,L|E,J,B,C,A,G,L,K
A,B,C,E,G,I,K,L|E,G,B,A,I,C,L,K
A,B,C,E,G,I,J,L|E,J,B,C,A,G,L,I
A,B,C,E,G,I,J,K|E,J,B,C,A,G,I,K
A,B,C,E,G,H,K,L|E,G,B,C,A,H,L,K
A,B,C,E,G,H,J,L|H,J,B,C,A,G,L,E
A,B,C,E,G,H,J,K|H,J,B,C,A,G,E,K
A,B,C,E,G,H,I,L|E,G,B,C,A,H,L,I
A,B,C,E,G,H,I,K|E,G,B,C,A,H,I,K
A,B,C,E,G,H,I,J|H,J,B,C,A,G,E,I
A,B,C,E,F,J,K,L|E,J,B,C,A,F,L,K
A,B,C,E,F,I,K,L|E,I,B,C,A,F,L,K
A,B,C,E,F,I,J,L|E,J,B,C,A,F,L,I
A,B,C,E,F,I,J,K|E,J,B,C,A,F,I,K
A,B,C,E,F,H,K,L|H,E,B,C,A,F,L,K
A,B,C,E,F,H,J,L|H,J,B,C,A,F,L,E
A,B,C,E,F,H,J,K|H,J,B,C,A,F,E,K
A,B,C,E,F,H,I,L|H,E,B,C,A,F,L,I
A,B,C,E,F,H,I,K|H,E,B,C,A,F,I,K
A,B,C,E,F,H,I,J|H,J,B,C,A,F,E,I
A,B,C,E,F,G,K,L|E,G,B,C,A,F,L,K
A,B,C,E,F,G,J,L|E,G,B,C,A,F,L,J
A,B,C,E,F,G,J,K|E,G,B,C,A,F,J,K
A,B,C,E,F,G,I,L|E,G,B,C,A,F,L,I
A,B,C,E,F,G,I,K|E,G,B,C,A,F,I,K
A,B,C,E,F,G,I,J|E,G,B,C,A,F,I,J
A,B,C,E,F,G,H,L|H,G,B,C,A,F,L,E
A,B,C,E,F,G,H,K|H,G,B,C,A,F,E,K
A,B,C,E,F,G,H,J|H,G,B,C,A,F,E,J
A,B,C,E,F,G,H,I|H,G,B,C,A,F,E,I
A,B,C,D,I,J,K,L|I,J,B,C,A,D,L,K
A,B,C,D,H,J,K,L|H,J,B,C,A,D,L,K
A,B,C,D,H,I,K,L|H,I,B,C,A,D,L,K
A,B,C,D,H,I,J,L|H,J,B,C,A,D,L,I
A,B,C,D,H,I,J,K|H,J,B,C,A,D,I,K
A,B,C,D,G,J,K,L|C,J,B,D,A,G,L,K
A,B,C,D,G,I,K,L|I,G,B,C,A,D,L,K
A,B,C,D,G,I,J,L|C,J,B,D,A,G,L,I
A,B,C,D,G,I,J,K|C,J,B,D,A,G,I,K
A,B,C,D,G,H,K,L|H,G,B,C,A,D,L,K
A,B,C,D,G,H,J,L|H,G,B,C,A,D,L,J
A,B,C,D,G,H,J,K|H,G,B,C,A,D,J,K
A,B,C,D,G,H,I,L|H,G,B,C,A,D,L,I
A,B,C,D,G,H,I,K|H,G,B,C,A,D,I,K
A,B,C,D,G,H,I,J|H,G,B,C,A,D,I,J
A,B,C,D,F,J,K,L|C,J,B,D,A,F,L,K
A,B,C,D,F,I,K,L|C,I,B,D,A,F,L,K
A,B,C,D,F,I,J,L|C,J,B,D,A,F,L,I
A,B,C,D,F,I,J,K|C,J,B,D,A,F,I,K
A,B,C,D,F,H,K,L|H,F,B,C,A,D,L,K
A,B,C,D,F,H,J,L|C,J,B,D,A,F,L,H
A,B,C,D,F,H,J,K|H,J,B,C,A,F,D,K
A,B,C,D,F,H,I,L|H,F,B,C,A,D,L,I
A,B,C,D,F,H,I,K|H,F,B,C,A,D,I,K
A,B,C,D,F,H,I,J|H,J,B,C,A,F,D,I
A,B,C,D,F,G,K,L|C,G,B,D,A,F,L,K
A,B,C,D,F,G,J,L|C,G,B,D,A,F,L,J
A,B,C,D,F,G,J,K|C,G,B,D,A,F,J,K
A,B,C,D,F,G,I,L|C,G,B,D,A,F,L,I
A,B,C,D,F,G,I,K|C,G,B,D,A,F,I,K
A,B,C,D,F,G,I,J|C,G,B,D,A,F,I,J
A,B,C,D,F,G,H,L|C,G,B,D,A,F,L,H
A,B,C,D,F,G,H,K|H,G,B,C,A,F,D,K
A,B,C,D,F,G,H,J|H,G,B,C,A,F,D,J
A,B,C,D,F,G,H,I|H,G,B,C,A,F,D,I
A,B,C,D,E,J,K,L|E,J,B,C,A,D,L,K
A,B,C,D,E,I,K,L|E,I,B,C,A,D,L,K
A,B,C,D,E,I,J,L|E,J,B,C,A,D,L,I
A,B,C,D,E,I,J,K|E,J,B,C,A,D,I,K
A,B,C,D,E,H,K,L|H,E,B,C,A,D,L,K
A,B,C,D,E,H,J,L|H,J,B,C,A,D,L,E
A,B,C,D,E,H,J,K|H,J,B,C,A,D,E,K
A,B,C,D,E,H,I,L|H,E,B,C,A,D,L,I
A,B,C,D,E,H,I,K|H,E,B,C,A,D,I,K
A,B,C,D,E,H,I,J|H,J,B,C,A,D,E,I
A,B,C,D,E,G,K,L|E,G,B,C,A,D,L,K
A,B,C,D,E,G,J,L|E,G,B,C,A,D,L,J
A,B,C,D,E,G,J,K|E,G,B,C,A,D,J,K
A,B,C,D,E,G,I,L|E,G,B,C,A,D,L,I
A,B,C,D,E,G,I,K|E,G,B,C,A,D,I,K
A,B,C,D,E,G,I,J|E,G,B,C,A,D,I,J
A,B,C,D,E,G,H,L|H,G,B,C,A,D,L,E
A,B,C,D,E,G,H,K|H,G,B,C,A,D,E,K
A,B,C,D,E,G,H,J|H,G,B,C,A,D,E,J
A,B,C,D,E,G,H,I|H,G,B,C,A,D,E,I
A,B,C,D,E,F,K,L|C,E,B,D,A,F,L,K
A,B,C,D,E,F,J,L|C,J,B,D,A,F,L,E
A,B,C,D,E,F,J,K|C,J,B,D,A,F,E,K
A,B,C,D,E,F,I,L|C,E,B,D,A,F,L,I
A,B,C,D,E,F,I,K|C,E,B,D,A,F,I,K
A,B,C,D,E,F,I,J|C,J,B,D,A,F,E,I
A,B,C,D,E,F,H,L|H,F,B,C,A,D,L,E
A,B,C,D,E,F,H,K|H,E,B,C,A,F,D,K
A,B,C,D,E,F,H,J|H,J,B,C,A,F,D,E
A,B,C,D,E,F,H,I|H,E,B,C,A,F,D,I
A,B,C,D,E,F,G,L|C,G,B,D,A,F,L,E
A,B,C,D,E,F,G,K|C,G,B,D,A,F,E,K
A,B,C,D,E,F,G,J|C,G,B,D,A,F,E,J
A,B,C,D,E,F,G,I|C,G,B,D,A,F,E,I
A,B,C,D,E,F,G,H|H,G,B,C,A,F,D,E`;

function winnerOf(matchNumber: number): WinnerOfMatchSeedSpec {
  return {
    kind: "WINNER_OF_MATCH",
    matchNumber,
  };
}

function groupWinner(groupLetter: GroupLetter): GroupSeedSpec {
  return {
    groupLetter,
    kind: "GROUP_POSITION",
    position: 1,
  };
}

function groupRunnerUp(groupLetter: GroupLetter): GroupSeedSpec {
  return {
    groupLetter,
    kind: "GROUP_POSITION",
    position: 2,
  };
}

function bestThird(
  slotKey: BestThirdSlotKey,
  allowedGroups: GroupLetter[],
): BestThirdSeedSpec {
  return {
    allowedGroups,
    kind: "BEST_THIRD",
    slotKey,
  };
}

const MATCH_SEEDS: Partial<Record<number, Record<WinnerSide, BracketSeedSpec>>> = {
  73: {
    AWAY: groupRunnerUp("B"),
    HOME: groupRunnerUp("A"),
  },
  74: {
    AWAY: bestThird("E", ["A", "B", "C", "D", "F"]),
    HOME: groupWinner("E"),
  },
  75: {
    AWAY: groupRunnerUp("C"),
    HOME: groupWinner("F"),
  },
  76: {
    AWAY: groupRunnerUp("F"),
    HOME: groupWinner("C"),
  },
  77: {
    AWAY: bestThird("I", ["C", "D", "F", "G", "H"]),
    HOME: groupWinner("I"),
  },
  78: {
    AWAY: groupRunnerUp("I"),
    HOME: groupRunnerUp("E"),
  },
  79: {
    AWAY: bestThird("A", ["C", "E", "F", "H", "I"]),
    HOME: groupWinner("A"),
  },
  80: {
    AWAY: bestThird("L", ["E", "H", "I", "J", "K"]),
    HOME: groupWinner("L"),
  },
  81: {
    AWAY: bestThird("D", ["B", "E", "F", "I", "J"]),
    HOME: groupWinner("D"),
  },
  82: {
    AWAY: bestThird("G", ["A", "E", "H", "I", "J"]),
    HOME: groupWinner("G"),
  },
  83: {
    AWAY: groupRunnerUp("L"),
    HOME: groupRunnerUp("K"),
  },
  84: {
    AWAY: groupRunnerUp("J"),
    HOME: groupWinner("H"),
  },
  85: {
    AWAY: bestThird("B", ["E", "F", "G", "I", "J"]),
    HOME: groupWinner("B"),
  },
  86: {
    AWAY: groupRunnerUp("H"),
    HOME: groupWinner("J"),
  },
  87: {
    AWAY: bestThird("K", ["D", "E", "I", "J", "L"]),
    HOME: groupWinner("K"),
  },
  88: {
    AWAY: groupRunnerUp("G"),
    HOME: groupRunnerUp("D"),
  },
  89: {
    AWAY: winnerOf(75),
    HOME: winnerOf(73),
  },
  90: {
    AWAY: winnerOf(77),
    HOME: winnerOf(74),
  },
  91: {
    AWAY: winnerOf(78),
    HOME: winnerOf(76),
  },
  92: {
    AWAY: winnerOf(80),
    HOME: winnerOf(79),
  },
  93: {
    AWAY: winnerOf(84),
    HOME: winnerOf(83),
  },
  94: {
    AWAY: winnerOf(82),
    HOME: winnerOf(81),
  },
  95: {
    AWAY: winnerOf(88),
    HOME: winnerOf(86),
  },
  96: {
    AWAY: winnerOf(87),
    HOME: winnerOf(85),
  },
  97: {
    AWAY: winnerOf(90),
    HOME: winnerOf(89),
  },
  98: {
    AWAY: winnerOf(94),
    HOME: winnerOf(93),
  },
  99: {
    AWAY: winnerOf(92),
    HOME: winnerOf(91),
  },
  100: {
    AWAY: winnerOf(96),
    HOME: winnerOf(95),
  },
  101: {
    AWAY: winnerOf(98),
    HOME: winnerOf(97),
  },
  102: {
    AWAY: winnerOf(100),
    HOME: winnerOf(99),
  },
  104: {
    AWAY: winnerOf(102),
    HOME: winnerOf(101),
  },
};

function buildBestThirdLookup() {
  return new Map(
    BEST_THIRD_COMBINATIONS_RAW.split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [groupsRaw, assignmentsRaw] = line.split("|");
        const groupsKey = groupsRaw
          .split(",")
          .map((group) => group.trim())
          .filter(Boolean)
          .sort()
          .join(",");
        const assignments = assignmentsRaw
          .split(",")
          .map((group) => group.trim()) as GroupLetter[];

        return [
          groupsKey,
          Object.fromEntries(
            BEST_THIRD_SLOT_KEYS.map((slotKey, index) => [
              slotKey,
              assignments[index],
            ]),
          ) as Record<BestThirdSlotKey, GroupLetter>,
        ] as const;
      }),
  );
}

const BEST_THIRD_LOOKUP = buildBestThirdLookup();

export function getKnockoutSeedSpec(
  matchNumber: number,
  side: WinnerSide,
): BracketSeedSpec | null {
  return MATCH_SEEDS[matchNumber]?.[side] ?? null;
}

export function getKnockoutSeedLabel(seed: BracketSeedSpec) {
  switch (seed.kind) {
    case "GROUP_POSITION":
      return seed.position === 1
        ? `Winner Group ${seed.groupLetter}`
        : `Runner-up Group ${seed.groupLetter}`;
    case "BEST_THIRD":
      return `Best 3rd place Group ${seed.allowedGroups.join("/")}`;
    case "WINNER_OF_MATCH":
      return `Winner Match ${seed.matchNumber}`;
  }
}

export function getKnockoutSlotLabel(
  matchNumber: number,
  side: WinnerSide,
) {
  const seed = getKnockoutSeedSpec(matchNumber, side);
  return seed ? getKnockoutSeedLabel(seed) : null;
}

function getMaxPoints(row: KnockoutSeedStandingRow) {
  return row.points + Math.max(0, MAX_GROUP_STAGE_MATCHES - row.played) * 3;
}

function hasExactWinnerLocked(
  candidate: KnockoutSeedStandingRow,
  rows: KnockoutSeedStandingRow[],
) {
  return rows.every(
    (row) => row.team_id === candidate.team_id || getMaxPoints(row) < candidate.points,
  );
}

function hasExactRunnerUpLocked(
  candidate: KnockoutSeedStandingRow,
  rows: KnockoutSeedStandingRow[],
) {
  const candidateMaxPoints = getMaxPoints(candidate);
  const guaranteedAbove = rows.filter(
    (row) => row.team_id !== candidate.team_id && row.points > candidateMaxPoints,
  );

  if (guaranteedAbove.length !== 1) {
    return false;
  }

  return rows.every((row) => {
    if (
      row.team_id === candidate.team_id ||
      guaranteedAbove.some((other) => other.team_id === row.team_id)
    ) {
      return true;
    }

    return getMaxPoints(row) < candidate.points;
  });
}

function resolveGroupSeedTeam(
  seed: GroupSeedSpec,
  standings: KnockoutSeedStandingRow[],
) {
  const rows = standings
    .filter((row) => row.group_letter === seed.groupLetter)
    .sort((left, right) => left.position - right.position);

  if (rows.length !== 4) {
    return null;
  }

  const candidate =
    rows.find((row) => row.position === seed.position && row.team !== null) ?? null;

  if (!candidate?.team) {
    return null;
  }

  if (candidate.is_final) {
    return candidate.team;
  }

  if (seed.position === 1 && candidate.position === 1) {
    return hasExactWinnerLocked(candidate, rows) ? candidate.team : null;
  }

  if (seed.position === 2 && candidate.position === 2) {
    return hasExactRunnerUpLocked(candidate, rows) ? candidate.team : null;
  }

  return null;
}

function resolveBestThirdSeedTeam(
  seed: BestThirdSeedSpec,
  standings: KnockoutSeedStandingRow[],
) {
  const thirdPlaceRows = standings.filter(
    (row) => row.position === 3 && row.is_final && row.team !== null,
  );
  const finalGroups = new Set(thirdPlaceRows.map((row) => row.group_letter));

  if (finalGroups.size !== 12) {
    return null;
  }

  const sortedThirdPlaceRows = [...thirdPlaceRows].sort((left, right) => {
    if (right.points !== left.points) {
      return right.points - left.points;
    }

    if (right.goal_difference !== left.goal_difference) {
      return right.goal_difference - left.goal_difference;
    }

    if (right.goals_for !== left.goals_for) {
      return right.goals_for - left.goals_for;
    }

    return left.group_letter.localeCompare(right.group_letter);
  });
  const eighth = sortedThirdPlaceRows[7];
  const ninth = sortedThirdPlaceRows[8];

  if (
    !eighth ||
    !ninth ||
    (eighth.points === ninth.points &&
      eighth.goal_difference === ninth.goal_difference &&
      eighth.goals_for === ninth.goals_for)
  ) {
    return null;
  }

  const key = sortedThirdPlaceRows
    .slice(0, 8)
    .map((row) => row.group_letter)
    .sort()
    .join(",");
  const mapping = BEST_THIRD_LOOKUP.get(key);

  if (!mapping) {
    return null;
  }

  const resolvedGroup = mapping[seed.slotKey];

  if (!seed.allowedGroups.includes(resolvedGroup)) {
    return null;
  }

  return (
    sortedThirdPlaceRows.find((row) => row.group_letter === resolvedGroup)?.team ??
    null
  );
}

export function resolveKnockoutSeedTeam(input: {
  matchesByNumber: Map<number, KnockoutSeedMatchRow>;
  seed: BracketSeedSpec;
  standings: KnockoutSeedStandingRow[];
  visitedMatchNumbers?: Set<number>;
}): KnockoutSeedTeam | null {
  switch (input.seed.kind) {
    case "GROUP_POSITION":
      return resolveGroupSeedTeam(input.seed, input.standings);
    case "BEST_THIRD":
      return resolveBestThirdSeedTeam(input.seed, input.standings);
    case "WINNER_OF_MATCH": {
      const visitedMatchNumbers = input.visitedMatchNumbers ?? new Set<number>();

      if (visitedMatchNumbers.has(input.seed.matchNumber)) {
        return null;
      }

      const match = input.matchesByNumber.get(input.seed.matchNumber);

      if (!match || match.status !== "FINISHED" || !match.winner_side) {
        return null;
      }

      const actualWinner =
        match.winner_side === "HOME" ? match.home_team : match.away_team;

      if (actualWinner) {
        return actualWinner;
      }

      const nestedSeed = getKnockoutSeedSpec(
        input.seed.matchNumber,
        match.winner_side,
      );

      if (!nestedSeed) {
        return null;
      }

      visitedMatchNumbers.add(input.seed.matchNumber);

      return resolveKnockoutSeedTeam({
        matchesByNumber: input.matchesByNumber,
        seed: nestedSeed,
        standings: input.standings,
        visitedMatchNumbers,
      });
    }
  }
}
