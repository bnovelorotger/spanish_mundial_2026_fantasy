import type { BracketMatchViewModel, WinnerSide } from "@/lib/types/worldcup";

export function getDisplayedWinnerSlot(match: BracketMatchViewModel): WinnerSide | null {
  return match.prediction?.currentWinnerSlot ?? null;
}

export function getPersistedPickNotice(match: BracketMatchViewModel) {
  const persistedTeam = match.prediction?.predictedWinnerTeam;

  if (!persistedTeam) {
    return null;
  }

  if (match.prediction?.warningState !== "STALE_UNRESOLVED") {
    return null;
  }

  return {
    description: `Tu pick sigue siendo ${persistedTeam.name}, pero ese equipo ya no ocupa ningun lado resoluble de este cruce. No se marcara otro equipo como seleccionado.`,
    title: `Tu pick guardado: ${persistedTeam.name}`,
    tone: "warning" as const,
  };
}
