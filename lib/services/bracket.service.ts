import type { SupabaseClient } from "@supabase/supabase-js";

import { getPhaseLock } from "@/lib/services/locks.service";
import type {
  BracketMatchViewModel,
  BracketRoundViewModel,
  BracketSlotViewModel,
  KnockoutRoundPhase,
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
  predicted_winner_team_id: string | null;
}

interface SaveKnockoutPredictionInput {
  matchId: string;
  phase: KnockoutRoundPhase;
  predictedWinnerTeamId: string;
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

export function canPredictKnockoutMatch(input: {
  awaySlot: BracketSlotViewModel;
  homeSlot: BracketSlotViewModel;
  isLocked: boolean;
}) {
  return (
    !input.isLocked &&
    input.homeSlot.isKnown &&
    input.awaySlot.isKnown &&
    input.homeSlot.id !== null &&
    input.awaySlot.id !== null
  );
}

function toRoundMatchViewModel(
  match: MatchRow,
  predictedWinnerTeamId: string | null,
  isRandom: boolean,
  lock: Awaited<ReturnType<typeof getPhaseLock>>,
): BracketMatchViewModel {
  const homeSlot = toSlot(match.home_team, match.home_placeholder);
  const awaySlot = toSlot(match.away_team, match.away_placeholder);

  return {
    awaySlot,
    canPredict: canPredictKnockoutMatch({
      awaySlot,
      homeSlot,
      isLocked: lock.isLocked,
    }),
    city: match.city,
    homeSlot,
    id: match.id,
    isFinal: match.phase === "FINAL",
    kickoff: match.kickoff,
    lock,
    matchNumber: match.match_number,
    phase: match.phase,
    prediction:
      predictedWinnerTeamId !== null
        ? {
            isRandom,
            predictedWinnerTeamId,
          }
        : null,
    venue: match.venue,
  };
}

export async function getBracketRounds(
  supabase: SupabaseClient,
  userId: string,
): Promise<BracketRoundViewModel[]> {
  const [matchesResponse, predictionsResponse, ...locks] = await Promise.all([
    supabase
      .from("matches")
      .select(BRACKET_MATCHES_SELECT)
      .in("phase", KNOCKOUT_PHASES)
      .order("kickoff", { ascending: true }),
    supabase
      .from("knockout_predictions")
      .select("match_id, predicted_winner_team_id, is_random")
      .eq("user_id", userId),
    ...KNOCKOUT_PHASES.map((phase) => getPhaseLock(supabase, phase)),
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
  const locksByPhase = new Map(
    locks.map((lock) => [lock.phase, lock] as const),
  );
  const matches = matchesResponse.data as MatchRow[];

  return KNOCKOUT_PHASES.map((phase) => ({
    label: KNOCKOUT_PHASE_LABELS[phase],
    matches: matches
      .filter((match) => match.phase === phase)
      .map((match) => {
        const prediction = predictionsByMatchId.get(match.id);
        const lock = locksByPhase.get(phase);

        if (!lock) {
          throw new Error(`Could not resolve lock state for ${phase}.`);
        }

        return toRoundMatchViewModel(
          match,
          prediction?.predicted_winner_team_id ?? null,
          prediction?.is_random ?? false,
          lock,
        );
      }),
    phase,
  }));
}

export function parseKnockoutPredictionFormData(formData: FormData):
  | { data: SaveKnockoutPredictionInput; error?: undefined }
  | { data?: undefined; error: string } {
  const matchId = String(formData.get("match_id") ?? "").trim();
  const predictedWinnerTeamId = String(
    formData.get("predicted_winner_team_id") ?? "",
  ).trim();
  const phase = String(formData.get("phase") ?? "").trim();

  if (!matchId || !predictedWinnerTeamId || !isKnockoutRoundPhase(phase)) {
    return {
      error: "No hemos podido resolver ese pronóstico de eliminatorias.",
    };
  }

  return {
    data: {
      matchId,
      phase,
      predictedWinnerTeamId,
    },
  };
}

export function validateKnockoutPredictionInput(input: {
  awaySlot: BracketSlotViewModel;
  homeSlot: BracketSlotViewModel;
  isLocked: boolean;
  predictedWinnerTeamId: string;
}):
  | { data: { predictedWinnerTeamId: string }; error?: undefined }
  | { data?: undefined; error: string } {
  const canPredict = canPredictKnockoutMatch({
    awaySlot: input.awaySlot,
    homeSlot: input.homeSlot,
    isLocked: input.isLocked,
  });

  if (input.isLocked) {
    return {
      error: "Esa ronda de eliminatorias ya está cerrada.",
    };
  }

  if (!canPredict) {
    return {
      error: "Elige un ganador cuando ya se conozcan los dos equipos del cruce.",
    };
  }

  const validWinnerIds = [input.homeSlot.id, input.awaySlot.id].filter(
    (value): value is string => value !== null,
  );

  if (!validWinnerIds.includes(input.predictedWinnerTeamId)) {
    return {
      error: "Elige uno de los equipos que aparecen en la tarjeta del cruce.",
    };
  }

  return {
    data: {
      predictedWinnerTeamId: input.predictedWinnerTeamId,
    },
  };
}

export async function saveKnockoutPrediction(
  supabase: SupabaseClient,
  userId: string,
  input: SaveKnockoutPredictionInput,
) {
  const [matchResponse, lock] = await Promise.all([
    supabase
      .from("matches")
      .select(
        "id, phase, home_team:teams!matches_home_team_id_fkey(id, name, code, flag_url, is_tbd), away_team:teams!matches_away_team_id_fkey(id, name, code, flag_url, is_tbd)",
      )
      .eq("id", input.matchId)
      .eq("phase", input.phase)
      .maybeSingle(),
    getPhaseLock(supabase, input.phase),
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
  const validation = validateKnockoutPredictionInput({
    awaySlot,
    homeSlot,
    isLocked: lock.isLocked,
    predictedWinnerTeamId: input.predictedWinnerTeamId,
  });

  if (!validation.data) {
    throw new Error(validation.error);
  }

  const { error } = await supabase.from("knockout_predictions").upsert(
    {
      is_random: false,
      match_id: input.matchId,
      predicted_winner_team_id: validation.data.predictedWinnerTeamId,
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
