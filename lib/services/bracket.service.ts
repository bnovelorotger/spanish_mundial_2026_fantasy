import type { SupabaseClient } from "@supabase/supabase-js";

import {
  getKnockoutSeedSpec,
  getKnockoutSlotLabel,
  resolveKnockoutSeedTeam,
  type KnockoutSeedMatchRow,
} from "@/lib/knockout-bracket";
import { getPhaseLock } from "@/lib/services/locks.service";
import {
  getKnockoutWindowLabel,
  getKnockoutWindowPhaseForRound,
  getKnockoutWindowStateForRound,
} from "@/lib/services/knockout-window.service";
import type {
  BracketMatchViewModel,
  BracketRoundViewModel,
  BracketSlotViewModel,
  GroupLetter,
  KnockoutRoundPhase,
  MatchStatus,
  QualificationStatus,
  KnockoutWindowState,
  WinnerSide,
} from "@/lib/types/worldcup";

interface TeamRow {
  code: string;
  flag_url: string | null;
  id: string;
  is_tbd: boolean;
  name: string;
}

interface MatchRow {
  away_placeholder: string | null;
  away_team: TeamRow | TeamRow[] | null;
  city: string | null;
  home_placeholder: string | null;
  home_team: TeamRow | TeamRow[] | null;
  id: string;
  kickoff: string;
  match_number: number;
  phase: KnockoutRoundPhase;
  status: MatchStatus;
  venue: string | null;
  winner_side: WinnerSide | null;
}

interface KnockoutPredictionRow {
  is_random: boolean;
  match_id: string;
  predicted_winner_slot: WinnerSide | null;
  predicted_winner_team_id: string | null;
}

interface StandingRow {
  goal_difference: number;
  goals_for: number;
  group_letter: GroupLetter;
  is_final: boolean;
  played: number;
  points: number;
  position: number;
  qualification_status: QualificationStatus | null;
  team: TeamRow | null;
  team_id: string;
}

interface SaveKnockoutPredictionInput {
  matchId: string;
  phase: KnockoutRoundPhase;
  predictedWinnerSlot: WinnerSide;
}

interface GetBracketRoundsOptions {
  predictionsClient?: SupabaseClient;
}

interface SaveKnockoutPredictionMatchRow {
  away_placeholder: string | null;
  away_team: TeamRow | TeamRow[] | null;
  id: string;
  home_placeholder: string | null;
  home_team: TeamRow | TeamRow[] | null;
  match_number: number;
  phase: KnockoutRoundPhase;
  status: MatchStatus;
  winner_side: WinnerSide | null;
}

const BRACKET_MATCHES_SELECT = `
  id,
  match_number,
  phase,
  status,
  winner_side,
  home_placeholder,
  away_placeholder,
  venue,
  city,
  kickoff,
  home_team:teams!matches_home_team_id_fkey(id, name, code, flag_url, is_tbd),
  away_team:teams!matches_away_team_id_fkey(id, name, code, flag_url, is_tbd)
`;

const QUALIFIED_STANDINGS_SELECT = `
  group_letter,
  position,
  played,
  points,
  goals_for,
  goal_difference,
  team_id,
  qualification_status,
  is_final
`;

export const KNOCKOUT_PHASES: KnockoutRoundPhase[] = [
  "ROUND_OF_32",
  "ROUND_OF_16",
  "QUARTER_FINALS",
  "SEMI_FINALS",
  "FINAL",
];

export const KNOCKOUT_PHASE_LABELS: Record<KnockoutRoundPhase, string> = {
  FINAL: "Final",
  QUARTER_FINALS: "Cuartos de final",
  ROUND_OF_16: "Octavos de final",
  ROUND_OF_32: "Dieciseisavos de final",
  SEMI_FINALS: "Semifinales",
};

function normalizeTeam(team: TeamRow | TeamRow[] | null) {
  if (!team) {
    return null;
  }

  const value = Array.isArray(team) ? team[0] : team;

  return value ?? null;
}

function buildMatchesByNumber(
  matches: Array<
    Pick<
      MatchRow,
      "away_team" | "home_team" | "match_number" | "status" | "winner_side"
    >
  >,
) {
  return new Map<number, KnockoutSeedMatchRow>(
    matches.map((match) => [
      match.match_number,
      {
        away_team: normalizeTeam(match.away_team),
        home_team: normalizeTeam(match.home_team),
        match_number: match.match_number,
        status: match.status,
        winner_side: match.winner_side,
      },
    ]),
  );
}

function buildPredictedWinnersByMatchNumber(input: {
  matches: Pick<MatchRow, "id" | "match_number">[];
  predictionsByMatchId: Map<string, KnockoutPredictionRow>;
}) {
  return new Map<number, WinnerSide>(
    input.matches.flatMap((match) => {
      const predictedWinnerSlot =
        input.predictionsByMatchId.get(match.id)?.predicted_winner_slot ?? null;

      return predictedWinnerSlot ? [[match.match_number, predictedWinnerSlot] as const] : [];
    }),
  );
}

function buildTeamsById(input: {
  matches: Pick<MatchRow, "away_team" | "home_team">[];
  qualifiedStandings: StandingRow[];
}) {
  const teamsById = new Map<string, TeamRow>();

  for (const match of input.matches) {
    const homeTeam = normalizeTeam(match.home_team);
    const awayTeam = normalizeTeam(match.away_team);

    if (homeTeam) {
      teamsById.set(homeTeam.id, homeTeam);
    }

    if (awayTeam) {
      teamsById.set(awayTeam.id, awayTeam);
    }
  }

  for (const standing of input.qualifiedStandings) {
    if (standing.team) {
      teamsById.set(standing.team.id, standing.team);
    }
  }

  return teamsById;
}

async function loadQualifiedStandings(
  supabase: SupabaseClient,
  contextLabel: string,
): Promise<StandingRow[]> {
  const standingsResponse = await supabase
    .from("group_standings")
    .select(QUALIFIED_STANDINGS_SELECT);

  if (standingsResponse.error) {
    console.error(
      `[bracket.service] Failed to load standings for ${contextLabel}`,
      standingsResponse.error,
    );
    return [];
  }

  const standings = standingsResponse.data as Array<
    Omit<StandingRow, "team">
  >;
  const teamIds = [...new Set(standings.map((standing) => standing.team_id))];

  if (teamIds.length === 0) {
    return standings.map((standing) => ({
      ...standing,
      team: null,
    }));
  }

  const teamsResponse = await supabase
    .from("teams")
    .select("id, name, code, flag_url, is_tbd")
    .in("id", teamIds);

  if (teamsResponse.error) {
    console.error(
      `[bracket.service] Failed to load teams for ${contextLabel}`,
      teamsResponse.error,
    );

    return standings.map((standing) => ({
      ...standing,
      team: null,
    }));
  }

  const teamsById = new Map(
    (teamsResponse.data as TeamRow[]).map((team) => [team.id, team] as const),
  );

  return standings.map((standing) => ({
    ...standing,
    team: teamsById.get(standing.team_id) ?? null,
  }));
}

function toSlot(
  team: TeamRow | TeamRow[] | null,
  placeholder: string | null,
  resolvedTeam?: TeamRow | null,
): BracketSlotViewModel {
  const value = normalizeTeam(team);
  const fallbackTeam = resolvedTeam ?? null;

  if (value) {
    return {
      code: value.code,
      flagUrl: value.flag_url,
      id: value.id,
      isKnown: !value.is_tbd,
      isTbd: value.is_tbd,
      name: value.name,
    };
  }

  if (fallbackTeam) {
    return {
      code: fallbackTeam.code,
      flagUrl: fallbackTeam.flag_url,
      id: fallbackTeam.id,
      isKnown: !fallbackTeam.is_tbd,
      isTbd: fallbackTeam.is_tbd,
      name: fallbackTeam.name,
    };
  }

  return {
    code: null,
    flagUrl: null,
    id: null,
    isKnown: false,
    isTbd: true,
    name: placeholder ?? "Por decidir",
  };
}

function toTeamSlot(team: TeamRow): BracketSlotViewModel {
  return {
    code: team.code,
    flagUrl: team.flag_url,
    id: team.id,
    isKnown: !team.is_tbd,
    isTbd: team.is_tbd,
    name: team.name,
  };
}

function parseQualifiedPlaceholder(placeholder: string | null) {
  const normalized = placeholder?.trim();

  if (!normalized) {
    return null;
  }

  const winnerMatch = normalized.match(/^Winner Group ([A-L])$/iu);

  if (winnerMatch?.[1]) {
    return {
      groupLetter: winnerMatch[1] as GroupLetter,
      target: "WINNER" as const,
    };
  }

  const runnerUpMatch = normalized.match(/^Runner[\s-]?up Group ([A-L])$/iu);

  if (runnerUpMatch?.[1]) {
    return {
      groupLetter: runnerUpMatch[1] as GroupLetter,
      target: "RUNNER_UP" as const,
    };
  }

  const bestThirdMatch = normalized.match(
    /^Best (?:Third|3rd place) Group ([A-L])$/iu,
  );

  if (bestThirdMatch?.[1]) {
    return {
      groupLetter: bestThirdMatch[1] as GroupLetter,
      target: "BEST_THIRD" as const,
    };
  }

  return null;
}

export function resolveQualifiedPlaceholderTeam(
  placeholder: string | null,
  standings: StandingRow[],
) {
  const parsed = parseQualifiedPlaceholder(placeholder);

  if (!parsed) {
    return null;
  }

  const matchingStanding = standings.find((standing) => {
    if (standing.group_letter !== parsed.groupLetter || !standing.is_final) {
      return false;
    }

    if (parsed.target === "WINNER") {
      return (
        standing.position === 1 &&
        (standing.qualification_status === "QUALIFIED_FIRST" ||
          standing.qualification_status === null)
      );
    }

    if (parsed.target === "RUNNER_UP") {
      return (
        standing.position === 2 &&
        (standing.qualification_status === "QUALIFIED_SECOND" ||
          standing.qualification_status === null)
      );
    }

    return (
      standing.position === 3 &&
      standing.qualification_status === "BEST_THIRD"
    );
  });

  return matchingStanding?.team ?? null;
}

export function isKnockoutRoundPhase(value: string): value is KnockoutRoundPhase {
  return KNOCKOUT_PHASES.includes(value as KnockoutRoundPhase);
}

export function isWinnerSide(value: string): value is WinnerSide {
  return value === "HOME" || value === "AWAY";
}

export function canPredictKnockoutMatch(input: {
  windowState: KnockoutWindowState;
}) {
  return input.windowState === "EDITABLE";
}

function toRoundMatchViewModel(input: {
  match: MatchRow;
  matchesByNumber: Map<number, KnockoutSeedMatchRow>;
  predictedWinnersByMatchNumber: Map<number, WinnerSide>;
  predictionsByMatchId: Map<string, KnockoutPredictionRow>;
  qualifiedStandings: StandingRow[];
  teamsById: Map<string, TeamRow>;
  lock: Awaited<ReturnType<typeof getPhaseLock>>;
  windowState: KnockoutWindowState;
}): BracketMatchViewModel {
  const homeSeed = getKnockoutSeedSpec(input.match.match_number, "HOME");
  const awaySeed = getKnockoutSeedSpec(input.match.match_number, "AWAY");
  const homeSlot = toSlot(
    input.match.home_team,
    getKnockoutSlotLabel(input.match.match_number, "HOME") ??
      input.match.home_placeholder,
    homeSeed
      ? resolveKnockoutSeedTeam({
          matchesByNumber: input.matchesByNumber,
          predictedWinnersByMatchNumber: input.predictedWinnersByMatchNumber,
          seed: homeSeed,
          standings: input.qualifiedStandings,
        })
      : resolveQualifiedPlaceholderTeam(
          input.match.home_placeholder,
          input.qualifiedStandings,
        ),
  );
  const awaySlot = toSlot(
    input.match.away_team,
    getKnockoutSlotLabel(input.match.match_number, "AWAY") ??
      input.match.away_placeholder,
    awaySeed
      ? resolveKnockoutSeedTeam({
          matchesByNumber: input.matchesByNumber,
          predictedWinnersByMatchNumber: input.predictedWinnersByMatchNumber,
          seed: awaySeed,
          standings: input.qualifiedStandings,
        })
      : resolveQualifiedPlaceholderTeam(
          input.match.away_placeholder,
          input.qualifiedStandings,
        ),
  );
  const prediction = input.predictionsByMatchId.get(input.match.id) ?? null;
  const predictedWinnerTeam =
    prediction?.predicted_winner_team_id
      ? (() => {
          const team = input.teamsById.get(prediction.predicted_winner_team_id);
          return team ? toTeamSlot(team) : null;
        })()
      : null;
  const selectedCurrentSlot =
    prediction?.predicted_winner_slot === "HOME"
      ? homeSlot
      : prediction?.predicted_winner_slot === "AWAY"
        ? awaySlot
        : null;
  const isOutdated =
    prediction !== null &&
    prediction.predicted_winner_team_id !== null &&
    prediction.predicted_winner_slot !== null &&
    selectedCurrentSlot?.id != null &&
    selectedCurrentSlot?.id !== prediction.predicted_winner_team_id;
  const predictionViewModel =
    prediction && prediction.predicted_winner_slot !== null
      ? {
          currentWinnerSlot: isOutdated
            ? null
            : prediction.predicted_winner_slot,
          isOutdated,
          isRandom: prediction.is_random,
          predictedWinnerSlot: prediction.predicted_winner_slot,
          predictedWinnerTeam,
        }
      : null;
  const windowPhase = getKnockoutWindowPhaseForRound(input.match.phase);

  return {
    awaySlot,
    canPredict: canPredictKnockoutMatch({
      windowState: input.windowState,
    }),
    city: input.match.city,
    homeSlot,
    id: input.match.id,
    isFinal: input.match.phase === "FINAL",
    kickoff: input.match.kickoff,
    lock: input.lock,
    matchNumber: input.match.match_number,
    phase: input.match.phase,
    prediction: predictionViewModel,
    venue: input.match.venue,
    windowLabel: getKnockoutWindowLabel(windowPhase),
    windowState: input.windowState,
  };
}

export async function getBracketRounds(
  supabase: SupabaseClient,
  userId: string,
  options?: GetBracketRoundsOptions,
): Promise<BracketRoundViewModel[]> {
  const predictionsClient = options?.predictionsClient ?? supabase;
  const [
    matchesResponse,
    predictionsResponse,
    qualifiedStandings,
    stageOneLock,
    stageTwoLock,
  ] =
    await Promise.all([
      supabase
        .from("matches")
        .select(BRACKET_MATCHES_SELECT)
        .in("phase", KNOCKOUT_PHASES)
        .order("kickoff", { ascending: true }),
      predictionsClient
        .from("knockout_predictions")
        .select(
          "match_id, predicted_winner_slot, predicted_winner_team_id, is_random",
        )
        .eq("user_id", userId),
      loadQualifiedStandings(supabase, "bracket placeholders"),
      getPhaseLock(supabase, "KNOCKOUT_STAGE_ONE"),
      getPhaseLock(supabase, "KNOCKOUT_STAGE_TWO"),
    ]);

  if (matchesResponse.error) {
    throw new Error(`Could not load bracket matches: ${matchesResponse.error.message}`);
  }

  if (predictionsResponse.error) {
    throw new Error(
      `Could not load knockout predictions: ${predictionsResponse.error.message}`,
    );
  }

  const predictionsByMatchId = new Map(
    (predictionsResponse.data as KnockoutPredictionRow[]).map((prediction) => [
      prediction.match_id,
      prediction,
    ]),
  );
  const matches = matchesResponse.data as MatchRow[];
  const matchesByNumber = buildMatchesByNumber(matches);
  const predictedWinnersByMatchNumber = buildPredictedWinnersByMatchNumber({
    matches,
    predictionsByMatchId,
  });
  const teamsById = buildTeamsById({
    matches,
    qualifiedStandings,
  });

  return KNOCKOUT_PHASES.map((phase) => ({
    label: KNOCKOUT_PHASE_LABELS[phase],
    matches: matches
      .filter((match) => match.phase === phase)
      .map((match) => {
        const windowPhase = getKnockoutWindowPhaseForRound(match.phase);
        const lock =
          windowPhase === "KNOCKOUT_STAGE_ONE" ? stageOneLock : stageTwoLock;
        const windowState = getKnockoutWindowStateForRound({
          phase: match.phase,
          stageOne: stageOneLock,
          stageTwo: stageTwoLock,
        });

        return toRoundMatchViewModel({
          lock,
          match,
          matchesByNumber,
          predictedWinnersByMatchNumber,
          predictionsByMatchId,
          qualifiedStandings,
          teamsById,
          windowState,
        });
      }),
    phase,
  }));
}

export function parseKnockoutPredictionFormData(formData: FormData):
  | { data: SaveKnockoutPredictionInput; error?: undefined }
  | { data?: undefined; error: string } {
  const matchId = String(formData.get("match_id") ?? "").trim();
  const predictedWinnerSlot = String(
    formData.get("predicted_winner_slot") ?? "",
  ).trim();
  const phase = String(formData.get("phase") ?? "").trim();

  if (!matchId || !isWinnerSide(predictedWinnerSlot) || !isKnockoutRoundPhase(phase)) {
    return {
      error: "No hemos podido resolver ese pronóstico de eliminatorias.",
    };
  }

  return {
    data: {
      matchId,
      phase,
      predictedWinnerSlot,
    },
  };
}

export function validateKnockoutPredictionInput(input: {
  predictedWinnerSlot: WinnerSide;
  windowState: KnockoutWindowState;
}):
  | { data: { predictedWinnerSlot: WinnerSide }; error?: undefined }
  | { data?: undefined; error: string } {
  if (input.windowState === "LOCKED") {
    return {
      error: "Esa ventana de eliminatorias ya está cerrada.",
    };
  }

  if (input.windowState === "UPCOMING") {
    return {
      error: "Esa ronda se abre en la segunda ventana de eliminatorias.",
    };
  }

  return {
    data: {
      predictedWinnerSlot: input.predictedWinnerSlot,
    },
  };
}

export async function saveKnockoutPrediction(
  supabase: SupabaseClient,
  userId: string,
  input: SaveKnockoutPredictionInput,
) {
  const [
    matchesResponse,
    predictionsResponse,
    qualifiedStandings,
    stageOneLock,
    stageTwoLock,
  ] =
    await Promise.all([
      supabase
        .from("matches")
        .select(BRACKET_MATCHES_SELECT)
        .in("phase", KNOCKOUT_PHASES),
      supabase
        .from("knockout_predictions")
        .select(
          "match_id, predicted_winner_slot, predicted_winner_team_id, is_random",
        )
        .eq("user_id", userId),
      loadQualifiedStandings(supabase, "knockout prediction save"),
      getPhaseLock(supabase, "KNOCKOUT_STAGE_ONE"),
      getPhaseLock(supabase, "KNOCKOUT_STAGE_TWO"),
    ]);

  if (matchesResponse.error) {
    throw new Error(
      `Could not load knockout matches: ${matchesResponse.error.message}`,
    );
  }

  if (predictionsResponse.error) {
    throw new Error(
      `Could not load knockout predictions: ${predictionsResponse.error.message}`,
    );
  }

  const matches = matchesResponse.data as SaveKnockoutPredictionMatchRow[];
  const matchesByNumber = buildMatchesByNumber(matches);
  const predictionsByMatchId = new Map(
    (predictionsResponse.data as KnockoutPredictionRow[]).map((prediction) => [
      prediction.match_id,
      prediction,
    ]),
  );
  const predictedWinnersByMatchNumber = buildPredictedWinnersByMatchNumber({
    matches,
    predictionsByMatchId,
  });
  const currentMatchNumber =
    matches.find((candidate) => candidate.id === input.matchId)?.match_number ?? null;

  if (currentMatchNumber !== null) {
    predictedWinnersByMatchNumber.set(currentMatchNumber, input.predictedWinnerSlot);
  }
  const match =
    matches.find(
      (candidate) =>
        candidate.id === input.matchId && candidate.phase === input.phase,
    ) ?? null;

  if (!match) {
    throw new Error("No hemos podido encontrar ese partido de eliminatorias.");
  }

  const homeSeed = getKnockoutSeedSpec(match.match_number, "HOME");
  const awaySeed = getKnockoutSeedSpec(match.match_number, "AWAY");
  const homeSlot = toSlot(
    match.home_team,
    getKnockoutSlotLabel(match.match_number, "HOME") ?? match.home_placeholder,
    homeSeed
      ? resolveKnockoutSeedTeam({
          matchesByNumber,
          predictedWinnersByMatchNumber,
          seed: homeSeed,
          standings: qualifiedStandings,
        })
      : resolveQualifiedPlaceholderTeam(
          match.home_placeholder,
          qualifiedStandings,
        ),
  );
  const awaySlot = toSlot(
    match.away_team,
    getKnockoutSlotLabel(match.match_number, "AWAY") ?? match.away_placeholder,
    awaySeed
      ? resolveKnockoutSeedTeam({
          matchesByNumber,
          predictedWinnersByMatchNumber,
          seed: awaySeed,
          standings: qualifiedStandings,
        })
      : resolveQualifiedPlaceholderTeam(
          match.away_placeholder,
          qualifiedStandings,
        ),
  );
  const windowState = getKnockoutWindowStateForRound({
    phase: input.phase,
    stageOne: stageOneLock,
    stageTwo: stageTwoLock,
  });
  const validation = validateKnockoutPredictionInput({
    predictedWinnerSlot: input.predictedWinnerSlot,
    windowState,
  });

  if (!validation.data) {
    throw new Error(validation.error);
  }

  const predictedWinnerTeamId =
    validation.data.predictedWinnerSlot === "HOME" ? homeSlot.id : awaySlot.id;

  const { error } = await supabase.from("knockout_predictions").upsert(
    {
      confirmed_at: new Date().toISOString(),
      confirmed_by: userId,
      is_random: false,
      match_id: input.matchId,
      predicted_winner_slot: validation.data.predictedWinnerSlot,
      predicted_winner_team_id: predictedWinnerTeamId,
      provenance: "USER_SUBMITTED" as const,
      provenance_note: null,
      user_id: userId,
    },
    {
      onConflict: "user_id,match_id",
    },
  );

  if (error) {
    throw new Error(
      `Could not save knockout prediction: ${error.message}`,
    );
  }
}
