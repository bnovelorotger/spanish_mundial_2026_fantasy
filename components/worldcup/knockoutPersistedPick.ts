import type { BracketMatchViewModel } from "@/lib/types/worldcup";

function currentSlotForPrediction(match: BracketMatchViewModel) {
  if (!match.prediction?.predictedWinnerSlot) {
    return null;
  }

  return match.prediction.predictedWinnerSlot === "HOME"
    ? match.homeSlot
    : match.awaySlot;
}

export function getPersistedPickNotice(match: BracketMatchViewModel) {
  const persistedTeam = match.prediction?.predictedWinnerTeam;

  if (!persistedTeam) {
    return null;
  }

  const currentSlot = currentSlotForPrediction(match);
  const shouldShow =
    match.prediction?.isOutdated === true || currentSlot?.id !== persistedTeam.id;

  if (!shouldShow) {
    return null;
  }

  if (match.prediction?.isOutdated && currentSlot) {
    return {
      description: `Guardaste este lado cuando lo ocupaba ${persistedTeam.name}. Ahora lo ocupa ${currentSlot.name}. Si avanza ${currentSlot.name} no sumara como acierto: tu pick sigue siendo ${persistedTeam.name}.`,
      title: `Tu pick guardado: ${persistedTeam.name}`,
      tone: "warning" as const,
    };
  }

  return {
    description: `Guardaste ${persistedTeam.name} en este cruce. Aunque ese lado aun no este resuelto en pantalla, el pick seguira contando como ${persistedTeam.name}.`,
    title: `Tu pick guardado: ${persistedTeam.name}`,
    tone: "default" as const,
  };
}
