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
    description:
      "Lo sentimos, este cruce ya no coincide con el pick que habias elegido antes.",
    title: "Pick anterior no disponible",
    tone: "warning" as const,
  };
}
