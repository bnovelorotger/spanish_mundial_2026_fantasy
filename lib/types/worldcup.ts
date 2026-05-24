export type MatchStatus =
  | "SCHEDULED"
  | "LIVE"
  | "FINISHED"
  | "POSTPONED"
  | "CANCELLED";

export type MatchPhase =
  | "GROUP_STAGE"
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "QUARTER_FINALS"
  | "SEMI_FINALS"
  | "THIRD_PLACE"
  | "FINAL";

export type LockPhase = MatchPhase | "CHAMPION";

export type GroupLetter =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L";

export type QualificationStatus =
  | "QUALIFIED_FIRST"
  | "QUALIFIED_SECOND"
  | "BEST_THIRD"
  | "ELIMINATED";

export type PredictionState =
  | "EDITABLE"
  | "LOCKED"
  | "PENDING"
  | "COMPLETED";

export type PointsSourceType =
  | "GROUP_POSITION"
  | "KNOCKOUT_WINNER"
  | "CHAMPION";

export type SyncRunStatus = "SUCCESS" | "PARTIAL" | "FAILED";

export type LockType = "AUTOMATIC" | "MANUAL";

export interface Team {
  id: string;
  name: string;
  code: string;
  flag_url: string | null;
  group_letter: GroupLetter;
  is_tbd: boolean;
  created_at: string;
}

export interface Match {
  id: string;
  match_number: number;
  phase: MatchPhase;
  group_letter: GroupLetter | null;
  home_team_id: string | null;
  away_team_id: string | null;
  home_placeholder: string | null;
  away_placeholder: string | null;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  venue: string | null;
  city: string | null;
  kickoff: string;
  created_at: string;
  updated_at: string;
}

export interface GroupStanding {
  id: string;
  group_letter: GroupLetter;
  team_id: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  qualification_status: QualificationStatus | null;
  is_final: boolean;
  created_at: string;
  updated_at: string;
}

export interface GroupPrediction {
  id: string;
  user_id: string;
  group_letter: GroupLetter;
  team_id: string;
  predicted_position: number;
  created_at: string;
  updated_at: string;
}

export interface KnockoutPrediction {
  id: string;
  user_id: string;
  match_id: string;
  predicted_winner_team_id: string | null;
  is_random: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChampionPrediction {
  id: string;
  user_id: string;
  team_id: string;
  created_at: string;
  updated_at: string;
}

export interface Points {
  id: string;
  user_id: string;
  source_type: PointsSourceType;
  source_id: string;
  points_awarded: number;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface GameLock {
  id: string;
  phase: LockPhase;
  locked: boolean;
  lock_at: string | null;
  locked_by: LockType | null;
  created_at: string;
  updated_at: string;
}

export interface SyncRun {
  id: string;
  provider: string;
  status: SyncRunStatus;
  teams_synced: number;
  matches_synced: number;
  standings_synced: number;
  points_recalculated: boolean;
  error_message: string | null;
  summary: Record<string, unknown> | null;
  started_at: string;
  finished_at: string | null;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppSetting {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
}

export interface TeamDTO {
  name: string;
  code: string;
  flag_url?: string;
  group_letter: GroupLetter;
  is_tbd?: boolean;
}

export interface MatchDTO {
  match_number: number;
  phase: MatchPhase;
  group_letter?: GroupLetter;
  home_team_code?: string;
  away_team_code?: string;
  home_placeholder?: string;
  away_placeholder?: string;
  home_score?: number;
  away_score?: number;
  status: MatchStatus;
  venue?: string;
  city?: string;
  kickoff: string;
}

export interface GroupStandingDTO {
  group_letter: GroupLetter;
  team_code: string;
  position: number;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
  qualification_status?: QualificationStatus;
  is_final: boolean;
}

export interface MatchTeamViewModel {
  code: string;
  flagUrl: string | null;
  isTbd: boolean;
  name: string;
}

export interface MatchCardViewModel {
  awayPlaceholder: string | null;
  awayScore: number | null;
  awayTeam: MatchTeamViewModel | null;
  city: string | null;
  groupLetter: GroupLetter | null;
  homePlaceholder: string | null;
  homeScore: number | null;
  homeTeam: MatchTeamViewModel | null;
  id: string;
  kickoff: string;
  matchNumber: number;
  phase: MatchPhase;
  status: MatchStatus;
  venue: string | null;
}

export interface MatchFilters {
  group?: GroupLetter | "ALL";
  phase?: MatchPhase | "ALL";
}

export interface GroupPredictionTeamViewModel {
  id: string;
  code: string;
  flagUrl: string | null;
  isTbd: boolean;
  name: string;
  predictedPosition: number;
}

export interface PhaseLockViewModel {
  effectiveLockAt: string | null;
  isLocked: boolean;
  phase: LockPhase;
  source: LockType;
}

export interface GroupPredictionGroupViewModel {
  groupLetter: GroupLetter;
  lock: PhaseLockViewModel;
  savedCount: number;
  state: PredictionState;
  teams: GroupPredictionTeamViewModel[];
}

export interface RankingEntry {
  position: number;
  userId: string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  totalPoints: number;
  groupPoints: number;
  knockoutPoints: number;
}

export interface PointsBreakdown {
  total: number;
  groupStage: number;
  knockout: number;
  champion: number;
  details: Array<{
    sourceType: PointsSourceType;
    sourceId: string;
    pointsAwarded: number;
    reason: string | null;
  }>;
}

export const MATCH_PHASE_OPTIONS: MatchPhase[] = [
  "GROUP_STAGE",
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "THIRD_PLACE",
  "FINAL",
];

export const GROUP_LETTER_OPTIONS: GroupLetter[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
];
