import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  GroupLetter,
  MatchCardViewModel,
  MatchFilters,
  MatchPhase,
  MatchStatus,
} from "@/lib/types/worldcup";
import { MATCH_PHASE_OPTIONS } from "@/lib/types/worldcup";
import { isRtveBroadcastMatchNumber } from "@/lib/utils/rtve-broadcasts";

interface MatchRow {
  away_placeholder: string | null;
  away_score: number | null;
  away_team: TeamRow | TeamRow[] | null;
  city: string | null;
  group_letter: GroupLetter | null;
  home_placeholder: string | null;
  home_score: number | null;
  home_team: TeamRow | TeamRow[] | null;
  id: string;
  kickoff: string;
  match_number: number;
  phase: MatchPhase;
  status: MatchStatus;
  venue: string | null;
}

interface TeamRow {
  code: string;
  flag_url: string | null;
  is_tbd: boolean;
  name: string;
}

const MATCHES_SELECT = `
  id,
  match_number,
  phase,
  group_letter,
  home_placeholder,
  away_placeholder,
  home_score,
  away_score,
  status,
  venue,
  city,
  kickoff,
  home_team:teams!matches_home_team_id_fkey(name, code, flag_url, is_tbd),
  away_team:teams!matches_away_team_id_fkey(name, code, flag_url, is_tbd)
`;

function normalizeTeam(
  team: TeamRow | TeamRow[] | null,
): MatchCardViewModel["homeTeam"] {
  if (!team) {
    return null;
  }

  const value = Array.isArray(team) ? team[0] : team;

  if (!value) {
    return null;
  }

  return {
    code: value.code,
    flagUrl: value.flag_url,
    isTbd: value.is_tbd,
    name: value.name,
  };
}

function toMatchCardViewModel(match: MatchRow): MatchCardViewModel {
  return {
    awayPlaceholder: match.away_placeholder,
    awayScore: match.away_score,
    awayTeam: normalizeTeam(match.away_team),
    city: match.city,
    groupLetter: match.group_letter,
    homePlaceholder: match.home_placeholder,
    homeScore: match.home_score,
    homeTeam: normalizeTeam(match.home_team),
    id: match.id,
    isOnRtve: isRtveBroadcastMatchNumber(match.match_number),
    kickoff: match.kickoff,
    matchNumber: match.match_number,
    phase: match.phase,
    status: match.status,
    venue: match.venue,
  };
}

export function isMatchPhase(value: string): value is MatchPhase {
  return MATCH_PHASE_OPTIONS.includes(value as MatchPhase);
}

export function isGroupLetter(value: string): value is GroupLetter {
  return /^[A-L]$/.test(value);
}

export function normalizeMatchFilters(input: {
  group?: string;
  phase?: string;
}): MatchFilters {
  const phase =
    input.phase === "ALL"
      ? "ALL"
      : input.phase && isMatchPhase(input.phase)
        ? input.phase
        : "ALL";

  const group =
    input.group === "ALL"
      ? "ALL"
      : input.group && isGroupLetter(input.group)
        ? input.group
        : "ALL";

  return {
    group,
    phase,
  };
}

export async function getMatches(
  supabase: SupabaseClient,
  filters: MatchFilters,
) {
  let query = supabase
    .from("matches")
    .select(MATCHES_SELECT)
    .order("kickoff", { ascending: true });

  if (filters.phase && filters.phase !== "ALL") {
    query = query.eq("phase", filters.phase);
  }

  if (filters.group && filters.group !== "ALL") {
    query = query.eq("group_letter", filters.group);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Could not load matches: ${error.message}`);
  }

  return (data as MatchRow[]).map(toMatchCardViewModel);
}

export async function getNextScheduledMatch(
  supabase: SupabaseClient,
  now = new Date(),
) {
  const { data, error } = await supabase
    .from("matches")
    .select(MATCHES_SELECT)
    .eq("status", "SCHEDULED")
    .gt("kickoff", now.toISOString())
    .order("kickoff", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load the next scheduled match: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return toMatchCardViewModel(data as MatchRow);
}
