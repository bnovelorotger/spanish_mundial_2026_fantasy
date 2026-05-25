import type { SupabaseClient } from "@supabase/supabase-js";

import type { LockPhase, LockType } from "@/lib/types/worldcup";
import { resolvePhaseLock } from "@/lib/utils/locks";

interface GameLockRow {
  lock_at: string | null;
  locked: boolean;
  locked_by: LockType | null;
  phase: LockPhase;
}

interface MatchKickoffRow {
  kickoff: string;
}

const GAME_LOCK_SELECT = "phase, locked, lock_at, locked_by";

async function getGameLockRow(supabase: SupabaseClient, phase: LockPhase) {
  const { data, error } = await supabase
    .from("game_locks")
    .select(GAME_LOCK_SELECT)
    .eq("phase", phase)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load lock state: ${error.message}`);
  }

  return data as GameLockRow | null;
}

async function getFirstPhaseKickoff(
  supabase: SupabaseClient,
  phase: Exclude<LockPhase, "CHAMPION">,
) {
  const { data, error } = await supabase
    .from("matches")
    .select("kickoff")
    .eq("phase", phase)
    .order("kickoff", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not resolve phase kickoff: ${error.message}`);
  }

  return (data as MatchKickoffRow | null)?.kickoff ?? null;
}

export async function getPhaseLock(
  supabase: SupabaseClient,
  phase: LockPhase,
  now = new Date(),
) {
  const lockRow = await getGameLockRow(supabase, phase);
  const firstKickoff =
    phase === "CHAMPION" ? null : await getFirstPhaseKickoff(supabase, phase);

  return resolvePhaseLock({
    firstKickoff,
    lockAt: lockRow?.lock_at ?? null,
    locked: lockRow?.locked ?? false,
    lockedBy: lockRow?.locked_by ?? null,
    now,
    phase,
  });
}

export async function getGroupStageLock(
  supabase: SupabaseClient,
  now = new Date(),
) {
  return getPhaseLock(supabase, "GROUP_STAGE", now);
}

export async function getNextOpenLock(
  supabase: SupabaseClient,
  now = new Date(),
) {
  const { data, error } = await supabase
    .from("game_locks")
    .select(GAME_LOCK_SELECT)
    .eq("locked", false)
    .not("lock_at", "is", null)
    .gt("lock_at", now.toISOString())
    .order("lock_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load the next open lock: ${error.message}`);
  }

  return (data as GameLockRow | null) ?? null;
}
