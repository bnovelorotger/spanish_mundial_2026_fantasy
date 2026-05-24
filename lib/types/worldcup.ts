// World Cup 2026 Pick'em App — Type definitions
// This file will contain shared types for the application.

// ============================================================
// Match Status
// ============================================================
export type MatchStatus =
  | 'SCHEDULED'
  | 'LIVE'
  | 'FINISHED'
  | 'POSTPONED'
  | 'CANCELLED';

// ============================================================
// Match Phase
// ============================================================
export type MatchPhase =
  | 'GROUP_STAGE'
  | 'ROUND_OF_32'
  | 'ROUND_OF_16'
  | 'QUARTER_FINALS'
  | 'SEMI_FINALS'
  | 'THIRD_PLACE'
  | 'FINAL';

// ============================================================
// Group Letters
// ============================================================
export type GroupLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L';

// ============================================================
// Qualification Status
// ============================================================
export type QualificationStatus =
  | 'QUALIFIED_FIRST'
  | 'QUALIFIED_SECOND'
  | 'BEST_THIRD'
  | 'ELIMINATED';

// ============================================================
// Prediction State
// ============================================================
export type PredictionState =
  | 'EDITABLE'
  | 'LOCKED'
  | 'PENDING'
  | 'COMPLETED';

// ============================================================
// Points Source Type
// ============================================================
export type PointsSourceType =
  | 'GROUP_POSITION'
  | 'KNOCKOUT_WINNER'
  | 'CHAMPION';

// ============================================================
// Sync Run Status
// ============================================================
export type SyncRunStatus = 'SUCCESS' | 'PARTIAL' | 'FAILED';

// ============================================================
// Lock Type
// ============================================================
export type LockType = 'AUTOMATIC' | 'MANUAL';

// ============================================================
// Database Row Types (matching Supabase schema)
// ============================================================
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
  phase: MatchPhase;
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

// ============================================================
// Provider DTOs
// ============================================================
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

// ============================================================
// View Models (for UI components)
// ============================================================
export interface MatchCardViewModel {
  id: string;
  matchNumber: number;
  phase: MatchPhase;
  groupLetter: GroupLetter | null;
  homeTeam: { name: string; code: string; flagUrl: string | null } | null;
  awayTeam: { name: string; code: string; flagUrl: string | null } | null;
  homePlaceholder: string | null;
  awayPlaceholder: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  venue: string | null;
  city: string | null;
  kickoff: string;
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
