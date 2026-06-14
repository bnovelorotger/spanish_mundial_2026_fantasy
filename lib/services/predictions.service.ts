import type { SupabaseClient } from "@supabase/supabase-js";

import { getGroupStageLock } from "@/lib/services/locks.service";
import type {
  GroupLetter,
  GroupPredictionGroupViewModel,
  GroupPredictionTeamViewModel,
  PredictionProvenance,
} from "@/lib/types/worldcup";
import { GROUP_LETTER_OPTIONS } from "@/lib/types/worldcup";

interface TeamRow {
  code: string;
  flag_url: string | null;
  group_letter: GroupLetter;
  id: string;
  is_tbd: boolean;
  name: string;
}

interface GroupPredictionRow {
  confirmed_at: string | null;
  group_letter: GroupLetter;
  predicted_position: number;
  provenance: PredictionProvenance;
  provenance_note: string | null;
  team_id: string;
}

export interface SaveGroupPredictionInput {
  groupLetter: GroupLetter;
  teamIds: string[];
}

const TEAM_SELECT = "id, name, code, flag_url, group_letter, is_tbd";

function defaultTeamsForGroup(teams: TeamRow[]) {
  return [...teams].sort((left, right) => {
    if (left.group_letter !== right.group_letter) {
      return left.group_letter.localeCompare(right.group_letter);
    }

    return left.name.localeCompare(right.name);
  });
}

function sortPredictionRows(predictions: GroupPredictionRow[]) {
  return [...predictions].sort(
    (left, right) => left.predicted_position - right.predicted_position,
  );
}

function toTeamViewModel(
  team: TeamRow,
  predictedPosition: number,
  prediction?: GroupPredictionRow,
): GroupPredictionTeamViewModel {
  return {
    code: team.code,
    confirmedAt: prediction?.confirmed_at ?? null,
    flagUrl: team.flag_url,
    id: team.id,
    isTbd: team.is_tbd,
    name: team.name,
    predictedPosition,
    provenance: prediction?.provenance ?? null,
    provenanceNote: prediction?.provenance_note ?? null,
  };
}

export function mapGroupTeams(
  groupLetter: GroupLetter,
  teams: TeamRow[],
  predictions: GroupPredictionRow[],
) {
  const savedRows = sortPredictionRows(
    predictions.filter((prediction) => prediction.group_letter === groupLetter),
  );
  const teamsById = new Map(teams.map((team) => [team.id, team]));
  const savedTeams = savedRows
    .map((prediction) => {
      const team = teamsById.get(prediction.team_id);

      if (!team) {
        return null;
      }

      return {
        prediction,
        team,
      };
    })
    .filter(
      (value): value is { prediction: GroupPredictionRow; team: TeamRow } =>
        value !== null,
    );

  if (savedTeams.length === 4) {
    return {
      savedCount: 4,
      teams: savedTeams.map(({ prediction, team }) =>
        toTeamViewModel(team, prediction.predicted_position, prediction),
      ),
    };
  }

  const savedTeamIds = new Set(savedTeams.map(({ team }) => team.id));
  const remainingTeams = defaultTeamsForGroup(teams).filter(
    (team) => !savedTeamIds.has(team.id),
  );
  const nextTeams: Array<GroupPredictionTeamViewModel | null> = Array.from(
    { length: Math.max(4, teams.length) },
    () => null,
  );
  const usedPositions = new Set<number>();

  for (const { prediction, team } of savedTeams) {
    const position = prediction.predicted_position;

    if (position < 1 || position > nextTeams.length || usedPositions.has(position)) {
      continue;
    }

    usedPositions.add(position);
    nextTeams[position - 1] = toTeamViewModel(team, position, prediction);
  }

  let remainingIndex = 0;
  const filledTeams = nextTeams.map((team, index) => {
    if (team) {
      return team;
    }

    const fallbackTeam = remainingTeams[remainingIndex];
    remainingIndex += 1;

    return fallbackTeam ? toTeamViewModel(fallbackTeam, index + 1) : null;
  });

  return {
    savedCount: savedTeams.length,
    teams: filledTeams.filter(
      (team): team is GroupPredictionTeamViewModel => team !== null,
    ),
  };
}

export function parseGroupPredictionFormData(formData: FormData):
  | { data: SaveGroupPredictionInput; error?: undefined }
  | { data?: undefined; error: string } {
  const rawGroupLetter = String(formData.get("group_letter") ?? "").trim();
  const rawTeamIds = formData
    .getAll("team_ids")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (!GROUP_LETTER_OPTIONS.includes(rawGroupLetter as GroupLetter)) {
    return {
      error: "No hemos podido identificar ese grupo.",
    };
  }

  return {
    data: {
      groupLetter: rawGroupLetter as GroupLetter,
      teamIds: rawTeamIds,
    },
  };
}

export function validateGroupPredictionInput(input: {
  availableTeamIds: string[];
  groupLetter: GroupLetter;
  isLocked: boolean;
  teamIds: string[];
}):
  | { data: SaveGroupPredictionInput; error?: undefined }
  | { data?: undefined; error: string } {
  if (input.isLocked) {
    return {
      error: "La fase de grupos ya está cerrada. Ya no puedes editar este pronóstico.",
    };
  }

  if (input.teamIds.length !== 4) {
    return {
      error: "Cada grupo debe incluir exactamente 4 equipos.",
    };
  }

  const uniqueTeamIds = new Set(input.teamIds);

  if (uniqueTeamIds.size !== 4) {
    return {
      error: "Cada equipo solo puede aparecer una vez en el orden del grupo.",
    };
  }

  const allTeamsBelongToGroup = input.teamIds.every((teamId) =>
    input.availableTeamIds.includes(teamId),
  );

  if (!allTeamsBelongToGroup) {
    return {
      error: "Uno o más equipos no pertenecen a ese grupo.",
    };
  }

  const positions = input.teamIds.map((_, index) => index + 1);
  const hasValidPositions = positions.every(
    (position) => position >= 1 && position <= 4,
  );

  if (!hasValidPositions) {
    return {
      error: "Las posiciones del pronóstico deben mantenerse entre la 1 y la 4.",
    };
  }

  return {
    data: {
      groupLetter: input.groupLetter,
      teamIds: input.teamIds,
    },
  };
}

export async function getGroupPredictionGroups(
  supabase: SupabaseClient,
  userId: string,
): Promise<GroupPredictionGroupViewModel[]> {
  const [teamsResponse, predictionsResponse, groupStageLock] = await Promise.all([
    supabase
      .from("teams")
      .select(TEAM_SELECT)
      .order("group_letter", { ascending: true })
      .order("name", { ascending: true }),
    supabase
      .from("group_predictions")
      .select(
        "group_letter, team_id, predicted_position, provenance, provenance_note, confirmed_at",
      )
      .eq("user_id", userId),
    getGroupStageLock(supabase),
  ]);

  if (teamsResponse.error) {
    throw new Error(`Could not load teams: ${teamsResponse.error.message}`);
  }

  if (predictionsResponse.error) {
    throw new Error(
      `Could not load your group predictions: ${predictionsResponse.error.message}`,
    );
  }

  const teams = teamsResponse.data as TeamRow[];
  const predictions = predictionsResponse.data as GroupPredictionRow[];

  return GROUP_LETTER_OPTIONS.map((groupLetter) => {
    const groupTeams = teams.filter((team) => team.group_letter === groupLetter);
    const { savedCount, teams: orderedTeams } = mapGroupTeams(
      groupLetter,
      groupTeams,
      predictions,
    );
    const hasRecoveredRows = orderedTeams.some(
      (team) => team.provenance !== null && team.provenance !== "USER_SUBMITTED",
    );
    const isPartial = savedCount > 0 && savedCount < 4;

    return {
      groupLetter,
      hasRecoveredRows,
      isPartial,
      lock: groupStageLock,
      savedCount,
      state: groupStageLock.isLocked
        ? "LOCKED"
        : isPartial
          ? "PARTIAL"
          : hasRecoveredRows
            ? "NEEDS_REVIEW"
            : savedCount === 4
              ? "COMPLETED"
              : "EDITABLE",
      teams: orderedTeams,
    };
  });
}

export async function saveGroupPrediction(
  supabase: SupabaseClient,
  userId: string,
  input: SaveGroupPredictionInput,
) {
  const [teamsResponse, groupStageLock] = await Promise.all([
    supabase
      .from("teams")
      .select("id")
      .eq("group_letter", input.groupLetter)
      .order("name", { ascending: true }),
    getGroupStageLock(supabase),
  ]);

  if (teamsResponse.error) {
    throw new Error(`Could not load group teams: ${teamsResponse.error.message}`);
  }

  const validation = validateGroupPredictionInput({
    availableTeamIds: (teamsResponse.data as Array<{ id: string }>).map(
      (team) => team.id,
    ),
    groupLetter: input.groupLetter,
    isLocked: groupStageLock.isLocked,
    teamIds: input.teamIds,
  });

  if (!validation.data) {
    throw new Error(validation.error);
  }

  const deleteResponse = await supabase
    .from("group_predictions")
    .delete()
    .eq("user_id", userId)
    .eq("group_letter", input.groupLetter);

  if (deleteResponse.error) {
    throw new Error(
      `Could not clear previous picks: ${deleteResponse.error.message}`,
    );
  }

  const rows = validation.data.teamIds.map((teamId, index) => ({
    confirmed_at: new Date().toISOString(),
    confirmed_by: userId,
    group_letter: validation.data.groupLetter,
    predicted_position: index + 1,
    provenance: "USER_SUBMITTED" as const,
    provenance_note: null,
    team_id: teamId,
    user_id: userId,
  }));

  const insertResponse = await supabase.from("group_predictions").insert(rows);

  if (insertResponse.error) {
    throw new Error(
      `Could not save group predictions: ${insertResponse.error.message}`,
    );
  }
}
