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

export type KnockoutRoundPhase =
  | "ROUND_OF_32"
  | "ROUND_OF_16"
  | "QUARTER_FINALS"
  | "SEMI_FINALS"
  | "FINAL";

export type KnockoutWindowPhase =
  | "KNOCKOUT_STAGE_ONE"
  | "KNOCKOUT_STAGE_TWO";

export type LockPhase = MatchPhase | KnockoutWindowPhase | "CHAMPION";

export type WinnerSide = "HOME" | "AWAY";

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
  | "NEEDS_REVIEW"
  | "PARTIAL"
  | "PENDING"
  | "COMPLETED";

export type PredictionProvenance =
  | "USER_SUBMITTED"
  | "INFERRED_100"
  | "MANUAL_REVIEWED"
  | "BASELINE"
  | "IMPORTED_BACKUP";

export type PointsSourceType =
  | "GROUP_POSITION"
  | "KNOCKOUT_WINNER"
  | "CHAMPION";

export type SyncRunStatus = "SUCCESS" | "PARTIAL" | "FAILED";

export type LockType = "AUTOMATIC" | "MANUAL";

export type KnockoutWindowState = "EDITABLE" | "LOCKED" | "UPCOMING";
export type RankingTab = "overview" | "results" | "participants";
export type PredictionRevealState =
  | "HIDDEN_UNTIL_LOCK"
  | "VISIBLE_PENDING"
  | "VISIBLE_RESOLVED";
export type ParticipantPredictionResolutionState =
  | "CORRECT"
  | "WRONG"
  | "PENDING"
  | "EMPTY";

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
  winner_side: WinnerSide | null;
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
  confirmed_at: string | null;
  confirmed_by: string | null;
  provenance: PredictionProvenance;
  provenance_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface KnockoutPrediction {
  id: string;
  user_id: string;
  match_id: string;
  predicted_winner_slot: WinnerSide | null;
  predicted_winner_team_id: string | null;
  is_random: boolean;
  confirmed_at: string | null;
  confirmed_by: string | null;
  provenance: PredictionProvenance;
  provenance_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface ChampionPrediction {
  id: string;
  user_id: string;
  team_id: string;
  confirmed_at: string | null;
  confirmed_by: string | null;
  provenance: PredictionProvenance;
  provenance_note: string | null;
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
  avatar_team_code: string | null;
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
  winner_side?: WinnerSide;
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
  isOnRtve: boolean;
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
  confirmedAt: string | null;
  flagUrl: string | null;
  isTbd: boolean;
  name: string;
  predictedPosition: number;
  provenance: PredictionProvenance | null;
  provenanceNote: string | null;
}

export interface PhaseLockViewModel {
  effectiveLockAt: string | null;
  isLocked: boolean;
  phase: LockPhase;
  source: LockType;
}

export interface GroupPredictionGroupViewModel {
  groupLetter: GroupLetter;
  hasRecoveredRows: boolean;
  isPartial: boolean;
  lock: PhaseLockViewModel;
  savedCount: number;
  state: PredictionState;
  teams: GroupPredictionTeamViewModel[];
}

export interface RankingEntry {
  avatarUrl: string | null;
  avatarSource: "photo" | "team" | null;
  championPoints: number;
  createdAt: string;
  displayName: string | null;
  gapToLeader: number;
  gapToPrevious: number | null;
  groupPoints: number;
  knockoutPoints: number;
  position: number;
  totalPoints: number;
  userId: string;
  username: string;
}

export interface RankingModel {
  entries: RankingEntry[];
  isLive: boolean;
}

export interface PointsBreakdown {
  champion: number;
  details: Array<{
    metadata: Record<string, unknown> | null;
    pointsAwarded: number;
    reason: string | null;
    sourceId: string;
    sourceType: PointsSourceType;
  }>;
  groupStage: number;
  knockout: number;
  total: number;
}

export type PredictionStamp =
  | "+1 pto"
  | "+2 pts"
  | "+3 pts"
  | "+4 pts"
  | "+6 pts"
  | "+8 pts"
  | "+15 pts"
  | "+25 pts"
  | "Exacto"
  | "Fallo"
  | "Recuperado";

export interface RankingStamp {
  label: PredictionStamp;
  tone: "exact" | "miss" | "points" | "recovered";
}

export interface BracketSlotViewModel {
  code: string | null;
  flagUrl: string | null;
  id: string | null;
  isKnown: boolean;
  isTbd: boolean;
  name: string;
}

export interface BracketPredictionViewModel {
  canonicalMatchNumber: number;
  currentWinnerSlot: WinnerSide | null;
  isRandom: boolean;
  isOutdated: boolean;
  predictedWinnerSlot: WinnerSide | null;
  predictedWinnerTeam: BracketSlotViewModel | null;
  warningState: "NONE" | "STALE_UNRESOLVED";
}

export interface BracketMatchViewModel {
  awaySlot: BracketSlotViewModel;
  canPredict: boolean;
  city: string | null;
  homeSlot: BracketSlotViewModel;
  id: string;
  isFinal: boolean;
  kickoff: string;
  lock: PhaseLockViewModel;
  matchNumber: number;
  phase: KnockoutRoundPhase;
  prediction: BracketPredictionViewModel | null;
  windowLabel: string;
  windowState: KnockoutWindowState;
  venue: string | null;
}

export interface BracketRoundViewModel {
  label: string;
  matches: BracketMatchViewModel[];
  phase: KnockoutRoundPhase;
}

export interface KnockoutWindowSummary {
  ctaHref: string;
  description: string;
  effectiveLockAt: string | null;
  isAlertActive: boolean;
  isLocked: boolean;
  label: string;
  leadHours: number;
  phase: KnockoutWindowPhase;
  roundsLabel: string;
}

export interface LeagueImpactSummaryViewModel {
  description: string;
  hits: number;
  misses: number;
  pointsAwarded: number;
  sourceType: PointsSourceType;
}

export interface ResultsFeedMatchScoreViewModel {
  awayScore: number | null;
  awayTeam: MatchTeamViewModel | null;
  homeScore: number | null;
  homeTeam: MatchTeamViewModel | null;
  winnerSide: WinnerSide | null;
}

export interface ResultsFeedStandingEntryViewModel {
  points: number;
  position: number;
  qualificationStatus: QualificationStatus | null;
  team: MatchTeamViewModel | null;
}

export type ResultsFeedItemViewModel =
  | {
      city: string | null;
      groupLetter: GroupLetter;
      id: string;
      impact: LeagueImpactSummaryViewModel;
      kickoff: string;
      phase: "GROUP_STAGE";
      score: ResultsFeedMatchScoreViewModel;
      title: string;
      type: "GROUP_MATCH_RESULT";
      venue: string | null;
    }
  | {
      groupLetter: GroupLetter;
      id: string;
      impact: LeagueImpactSummaryViewModel;
      standings: ResultsFeedStandingEntryViewModel[];
      title: string;
      type: "GROUP_CLOSURE";
      updatedAt: string;
    }
  | {
      city: string | null;
      id: string;
      impact: LeagueImpactSummaryViewModel;
      kickoff: string;
      phase: KnockoutRoundPhase;
      score: ResultsFeedMatchScoreViewModel;
      title: string;
      type: "KNOCKOUT_MATCH_RESULT";
      venue: string | null;
    }
  | {
      city: string | null;
      championBonusPointsAwarded: number;
      id: string;
      impact: LeagueImpactSummaryViewModel;
      kickoff: string;
      phase: "FINAL";
      score: ResultsFeedMatchScoreViewModel;
      title: string;
      type: "FINAL_RESULT";
      venue: string | null;
    };

export interface ParticipantExplorerEntryViewModel {
  avatarSource: "photo" | "team" | null;
  avatarUrl: string | null;
  championPoints: number;
  displayName: string;
  groupPoints: number;
  isCurrentUser: boolean;
  knockoutPoints: number;
  position: number;
  totalPoints: number;
  userId: string;
  username: string;
}

export interface ParticipantGroupPredictionTeamViewModel {
  actualPosition: number | null;
  code: string | null;
  flagUrl: string | null;
  id: string | null;
  isTbd: boolean;
  name: string;
  pointsAwarded: number | null;
  predictedPosition: number;
  qualificationStatus: QualificationStatus | null;
  stamp: string | null;
}

export interface ParticipantGroupPredictionViewModel {
  groupLetter: GroupLetter;
  isFinal: boolean;
  revealState: PredictionRevealState;
  savedCount: number;
  teams: ParticipantGroupPredictionTeamViewModel[];
  totalPoints: number | null;
}

export interface ParticipantBracketMatchViewModel extends BracketMatchViewModel {
  awardedPoints: number | null;
  championBonusPointsAwarded: number | null;
  predictionRevealState: PredictionRevealState;
  resolutionState: ParticipantPredictionResolutionState;
}

export interface ParticipantBracketRoundViewModel {
  label: string;
  matches: ParticipantBracketMatchViewModel[];
  phase: KnockoutRoundPhase;
  revealState: PredictionRevealState;
}

export interface ParticipantDetailViewModel {
  avatarSource: "photo" | "team" | null;
  avatarUrl: string | null;
  breakdown: PointsBreakdown;
  bracketRounds: ParticipantBracketRoundViewModel[];
  displayName: string;
  gapCopy: string;
  groupLock: PhaseLockViewModel;
  groups: ParticipantGroupPredictionViewModel[];
  isCurrentUser: boolean;
  knockoutStageOneLock: PhaseLockViewModel;
  knockoutStageTwoLock: PhaseLockViewModel;
  position: number | null;
  totalPoints: number;
  userId: string;
  username: string;
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
