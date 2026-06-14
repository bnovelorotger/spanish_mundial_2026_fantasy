import type {
  LockPhase,
  LockType,
  PhaseLockViewModel,
  PredictionState,
} from "@/lib/types/worldcup";

interface ResolvePhaseLockInput {
  firstKickoff: string | null;
  lockAt: string | null;
  locked: boolean;
  lockedBy: LockType | null;
  now?: Date;
  phase: LockPhase;
}

function hasReachedLockTime(lockAt: string | null, now: Date) {
  if (!lockAt) {
    return false;
  }

  return now.getTime() >= new Date(lockAt).getTime();
}

export function resolvePhaseLock({
  firstKickoff,
  lockAt,
  locked,
  lockedBy,
  now = new Date(),
  phase,
}: ResolvePhaseLockInput): PhaseLockViewModel {
  if (lockedBy === "MANUAL") {
    return {
      effectiveLockAt: lockAt ?? firstKickoff,
      isLocked: locked,
      phase,
      source: "MANUAL",
    };
  }

  const effectiveLockAt = firstKickoff ?? lockAt;
  const automaticLock =
    locked || hasReachedLockTime(effectiveLockAt ?? lockAt, now);

  return {
    effectiveLockAt,
    isLocked: automaticLock,
    phase,
    source: "AUTOMATIC",
  };
}

export function resolvePredictionState(input: {
  hasDirtyChanges: boolean;
  hasRecoveredRows?: boolean;
  isLocked: boolean;
  savedCount: number;
}): PredictionState {
  if (input.isLocked) {
    return "LOCKED";
  }

  if (input.hasDirtyChanges) {
    return "PENDING";
  }

  if (input.savedCount > 0 && input.savedCount < 4) {
    return "PARTIAL";
  }

  if (input.hasRecoveredRows) {
    return "NEEDS_REVIEW";
  }

  if (input.savedCount === 4) {
    return "COMPLETED";
  }

  return "EDITABLE";
}
