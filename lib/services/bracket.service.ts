import type { SupabaseClient } from "@supabase/supabase-js";

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
  KnockoutRoundPhase,
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
  venue: string | null;
}

interface KnockoutPredictionRow {
  is_random: boolean;
  match_id: string;
  predicted_winner_slot: WinnerSide | null;
}

interface SaveKnockoutPredictionInput {
  matchId: string;
  phase: KnockoutRoundPhase;
  predictedWinnerSlot: WinnerSide;
}

interface SaveKnockoutPredictionMatchRow {
  away_team: TeamRow | TeamRow[] | null;
  id: string;
  home_team: TeamRow | TeamRow[] | null;
  phase: KnockoutRoundPhase;
}

const BRACKET_MATCHES_SELECT = `
  id,
  match_number,
  phase,
  home_placeholder,
  away_placeholder,
  venue,
  city,
  kickoff,
  home_team:teams!matches_home_team_id_fkey(id, name, code, flag_url, is_tbd),
  away_team:teams!matches_away_team_id_fkey(id, name, code, flag_url, is_tbd)
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

function toSlot(
  team: TeamRow | TeamRow[] | null,
  placeholder: string | null,
): BracketSlotViewModel {
  const value = normalizeTeam(team);

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

  return {
    code: null,
    flagUrl: null,
    id: null,
    isKnown: false,
    isTbd: true,
    name: placeholder ?? "Por decidir",
  };
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
  predictedWinnerSlot: WinnerSide | null;
  isRandom: boolean;
  lock: Awaited<ReturnType<typeof getPhaseLock>>;
  windowState: KnockoutWindowState;
}): BracketMatchViewModel {
  const homeSlot = toSlot(input.match.home_team, input.match.home_placeholder);
  const awaySlot = toSlot(input.match.away_team, input.match.away_placeholder);
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
    prediction:
      input.predictedWinnerSlot !== null
        ? {
            isRandom: input.isRandom,
            predictedWinnerSlot: input.predictedWinnerSlot,
          }
        : null,
    venue: input.match.venue,
    windowLabel: getKnockoutWindowLabel(windowPhase),
    windowState: input.windowState,
  };
}

export async function getBracketRounds(
  supabase: SupabaseClient,
  userId: string,
): Promise<BracketRoundViewModel[]> {
  const [matchesResponse, predictionsResponse, stageOneLock, stageTwoLock] =
    await Promise.all([
      supabase
        .from("matches")
        .select(BRACKET_MATCHES_SELECT)
        .in("phase", KNOCKOUT_PHASES)
        .order("kickoff", { ascending: true }),
      supabase
        .from("knockout_predictions")
        .select("match_id, predicted_winner_slot, is_random")
        .eq("user_id", userId),
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

  return KNOCKOUT_PHASES.map((phase) => ({
    label: KNOCKOUT_PHASE_LABELS[phase],
    matches: matches
      .filter((match) => match.phase === phase)
      .map((match) => {
        const prediction = predictionsByMatchId.get(match.id);
        const windowPhase = getKnockoutWindowPhaseForRound(match.phase);
        const lock =
          windowPhase === "KNOCKOUT_STAGE_ONE" ? stageOneLock : stageTwoLock;
        const windowState = getKnockoutWindowStateForRound({
          phase: match.phase,
          stageOne: stageOneLock,
          stageTwo: stageTwoLock,
        });

        return toRoundMatchViewModel({
          isRandom: prediction?.is_random ?? false,
          lock,
          match,
          predictedWinnerSlot: prediction?.predicted_winner_slot ?? null,
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
  const [matchResponse, stageOneLock, stageTwoLock] = await Promise.all([
    supabase
      .from("matches")
      .select(
        "id, phase, home_team:teams!matches_home_team_id_fkey(id, name, code, flag_url, is_tbd), away_team:teams!matches_away_team_id_fkey(id, name, code, flag_url, is_tbd)",
      )
      .eq("id", input.matchId)
      .eq("phase", input.phase)
      .maybeSingle(),
    getPhaseLock(supabase, "KNOCKOUT_STAGE_ONE"),
    getPhaseLock(supabase, "KNOCKOUT_STAGE_TWO"),
  ]);

  if (matchResponse.error) {
    throw new Error(
      `Could not load knockout match: ${matchResponse.error.message}`,
    );
  }

  const match = matchResponse.data as SaveKnockoutPredictionMatchRow | null;

  if (!match) {
    throw new Error("No hemos podido encontrar ese partido de eliminatorias.");
  }

  const homeSlot = toSlot(normalizeTeam(match.home_team), null);
  const awaySlot = toSlot(normalizeTeam(match.away_team), null);
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
