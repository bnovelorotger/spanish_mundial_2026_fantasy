import type {
  KnockoutRoundPhase,
  KnockoutWindowPhase,
  KnockoutWindowState,
  KnockoutWindowSummary,
  PhaseLockViewModel,
} from "@/lib/types/worldcup";

export const KNOCKOUT_WINDOW_ALERT_LEAD_HOURS = 24;

const KNOCKOUT_WINDOW_LABELS: Record<KnockoutWindowPhase, string> = {
  KNOCKOUT_STAGE_ONE: "Ventana 1",
  KNOCKOUT_STAGE_TWO: "Ventana 2",
};

const KNOCKOUT_WINDOW_ROUNDS_LABELS: Record<KnockoutWindowPhase, string> = {
  KNOCKOUT_STAGE_ONE: "Dieciseisavos y octavos",
  KNOCKOUT_STAGE_TWO: "Cuartos, semifinales y final",
};

const KNOCKOUT_WINDOW_CTA_HREF = "/predictions?tab=knockout";

export function isKnockoutWindowPhase(
  value: string,
): value is KnockoutWindowPhase {
  return value === "KNOCKOUT_STAGE_ONE" || value === "KNOCKOUT_STAGE_TWO";
}

export function getKnockoutWindowPhaseForRound(
  phase: KnockoutRoundPhase,
): KnockoutWindowPhase {
  return phase === "ROUND_OF_32" || phase === "ROUND_OF_16"
    ? "KNOCKOUT_STAGE_ONE"
    : "KNOCKOUT_STAGE_TWO";
}

export function getKnockoutWindowLabel(phase: KnockoutWindowPhase) {
  return KNOCKOUT_WINDOW_LABELS[phase];
}

export function getKnockoutWindowRoundsLabel(phase: KnockoutWindowPhase) {
  return KNOCKOUT_WINDOW_ROUNDS_LABELS[phase];
}

function isAlertActive(lockAt: string | null, now: Date) {
  if (!lockAt) {
    return false;
  }

  const lockTime = new Date(lockAt).getTime();
  const leadMs = KNOCKOUT_WINDOW_ALERT_LEAD_HOURS * 60 * 60 * 1000;
  const nowMs = now.getTime();

  return nowMs < lockTime && lockTime - nowMs <= leadMs;
}

function toWindowSummary(lock: PhaseLockViewModel): KnockoutWindowSummary {
  const phase = lock.phase as KnockoutWindowPhase;

  return {
    ctaHref: KNOCKOUT_WINDOW_CTA_HREF,
    description: `Cierra con el primer partido de ${getKnockoutWindowRoundsLabel(phase).toLowerCase()}.`,
    effectiveLockAt: lock.effectiveLockAt,
    isAlertActive: false,
    isLocked: lock.isLocked,
    label: getKnockoutWindowLabel(phase),
    leadHours: KNOCKOUT_WINDOW_ALERT_LEAD_HOURS,
    phase,
    roundsLabel: getKnockoutWindowRoundsLabel(phase),
  };
}

export function getCurrentKnockoutWindowSummary(input: {
  stageOne: PhaseLockViewModel;
  stageTwo: PhaseLockViewModel;
}): KnockoutWindowSummary | null {
  if (!input.stageOne.isLocked) {
    return toWindowSummary(input.stageOne);
  }

  if (!input.stageTwo.isLocked) {
    return toWindowSummary(input.stageTwo);
  }

  return null;
}

export function getKnockoutAlertSummary(input: {
  now?: Date;
  stageOne: PhaseLockViewModel;
  stageTwo: PhaseLockViewModel;
}): KnockoutWindowSummary | null {
  const now = input.now ?? new Date();

  for (const lock of [input.stageOne, input.stageTwo]) {
    if (
      !lock.isLocked &&
      isKnockoutWindowPhase(lock.phase) &&
      isAlertActive(lock.effectiveLockAt, now)
    ) {
      return {
        ...toWindowSummary(lock),
        isAlertActive: true,
      };
    }
  }

  return null;
}

export function getKnockoutWindowStateForRound(input: {
  phase: KnockoutRoundPhase;
  stageOne: PhaseLockViewModel;
  stageTwo: PhaseLockViewModel;
}): KnockoutWindowState {
  const windowPhase = getKnockoutWindowPhaseForRound(input.phase);

  if (windowPhase === "KNOCKOUT_STAGE_ONE") {
    return input.stageOne.isLocked ? "LOCKED" : "EDITABLE";
  }

  if (!input.stageOne.isLocked) {
    return "UPCOMING";
  }

  return input.stageTwo.isLocked ? "LOCKED" : "EDITABLE";
}
