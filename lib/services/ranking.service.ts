import type { SupabaseClient } from "@supabase/supabase-js";

import { getPointsBreakdownFromRows } from "./scoring.service";
import type {
  PointsBreakdown,
  PointsSourceType,
  RankingEntry,
  RankingStamp,
} from "../types/worldcup";

interface ProfileRow {
  avatar_url: string | null;
  created_at: string;
  display_name: string | null;
  id: string;
  username: string;
}

interface PointRow {
  created_at: string;
  metadata: Record<string, unknown> | null;
  points_awarded: number;
  reason: string | null;
  source_id: string;
  source_type: PointsSourceType;
  user_id: string;
}

function displayName(profile: ProfileRow) {
  return profile.display_name?.trim() || profile.username;
}

function sumPoints(
  rows: PointRow[],
  sourceType: PointsSourceType,
) {
  return rows
    .filter((row) => row.source_type === sourceType)
    .reduce((total, row) => total + row.points_awarded, 0);
}

function sourcePriority(sourceType: PointsSourceType) {
  if (sourceType === "CHAMPION") {
    return 0;
  }

  if (sourceType === "KNOCKOUT_WINNER") {
    return 1;
  }

  return 2;
}

export function buildRankingEntries(
  profiles: ProfileRow[],
  pointsRows: PointRow[],
): RankingEntry[] {
  const pointsByUser = new Map<string, PointRow[]>();

  for (const row of pointsRows) {
    const currentRows = pointsByUser.get(row.user_id) ?? [];
    currentRows.push(row);
    pointsByUser.set(row.user_id, currentRows);
  }

  const unsortedEntries = profiles.map((profile) => {
    const rows = pointsByUser.get(profile.id) ?? [];
    const groupPoints = sumPoints(rows, "GROUP_POSITION");
    const knockoutPoints = sumPoints(rows, "KNOCKOUT_WINNER");
    const championPoints = sumPoints(rows, "CHAMPION");
    const totalPoints = groupPoints + knockoutPoints + championPoints;

    return {
      avatarUrl: profile.avatar_url,
      championPoints,
      createdAt: profile.created_at,
      displayName: profile.display_name,
      gapToLeader: 0,
      gapToPrevious: null,
      groupPoints,
      knockoutPoints,
      position: 0,
      totalPoints,
      userId: profile.id,
      username: profile.username,
    } satisfies RankingEntry;
  });

  const sortedEntries = [...unsortedEntries].sort((left, right) => {
    if (right.totalPoints !== left.totalPoints) {
      return right.totalPoints - left.totalPoints;
    }

    if (right.knockoutPoints !== left.knockoutPoints) {
      return right.knockoutPoints - left.knockoutPoints;
    }

    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });

  const leaderPoints = sortedEntries[0]?.totalPoints ?? 0;

  return sortedEntries.map((entry, index) => {
    const previousEntry = sortedEntries[index - 1];

    return {
      ...entry,
      gapToLeader: leaderPoints - entry.totalPoints,
      gapToPrevious: previousEntry
        ? previousEntry.totalPoints - entry.totalPoints
        : null,
      position: index + 1,
    };
  });
}

async function loadProfilesAndPoints(supabase: SupabaseClient) {
  const [profilesResponse, pointsResponse] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, display_name, avatar_url, created_at")
      .order("created_at", { ascending: true }),
    supabase
      .from("points")
      .select(
        "user_id, source_type, source_id, points_awarded, reason, metadata, created_at",
      ),
  ]);

  if (profilesResponse.error) {
    throw new Error(`Could not load ranking profiles: ${profilesResponse.error.message}`);
  }

  if (pointsResponse.error) {
    throw new Error(`Could not load ranking points: ${pointsResponse.error.message}`);
  }

  return {
    pointsRows: pointsResponse.data as PointRow[],
    profiles: profilesResponse.data as ProfileRow[],
  };
}

function sortBreakdownRows(rows: PointRow[]) {
  return [...rows].sort((left, right) => {
    if (right.points_awarded !== left.points_awarded) {
      return right.points_awarded - left.points_awarded;
    }

    if (sourcePriority(left.source_type) !== sourcePriority(right.source_type)) {
      return sourcePriority(left.source_type) - sourcePriority(right.source_type);
    }

    return left.source_id.localeCompare(right.source_id);
  });
}

export async function getRankingByPhase(supabase: SupabaseClient) {
  const { pointsRows, profiles } = await loadProfilesAndPoints(supabase);
  return buildRankingEntries(profiles, pointsRows);
}

export async function getTopRanking(
  supabase: SupabaseClient,
  limit = 10,
) {
  const ranking = await getRankingByPhase(supabase);
  return ranking.slice(0, limit);
}

export async function getUserRankingPosition(
  supabase: SupabaseClient,
  userId: string,
) {
  const ranking = await getRankingByPhase(supabase);
  return ranking.find((entry) => entry.userId === userId) ?? null;
}

export async function getUserPointsBreakdown(
  supabase: SupabaseClient,
  userId: string,
): Promise<PointsBreakdown> {
  const { data, error } = await supabase
    .from("points")
    .select(
      "user_id, source_type, source_id, points_awarded, reason, metadata, created_at",
    )
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Could not load points breakdown: ${error.message}`);
  }

  return getPointsBreakdownFromRows(sortBreakdownRows(data as PointRow[]));
}

export function getUserGapCopy(
  ranking: RankingEntry[],
  userId: string,
) {
  const currentUserEntry = ranking.find((entry) => entry.userId === userId);

  if (!currentUserEntry) {
    return "Your ranking board will light up once points are on the table.";
  }

  if (currentUserEntry.position === 1) {
    return "You're setting the pace for the whole league.";
  }

  const leader = ranking[0];
  const leaderName = leader ? displayName({
    avatar_url: leader.avatarUrl,
    created_at: leader.createdAt,
    display_name: leader.displayName,
    id: leader.userId,
    username: leader.username,
  }) : "the leader";

  return `You're ${currentUserEntry.gapToLeader} pts behind ${leaderName}.`;
}

export function getRankingStamps(
  breakdown: PointsBreakdown,
  limit = 4,
): RankingStamp[] {
  const stamps = breakdown.details.slice(0, limit).flatMap<RankingStamp>((detail) => {
    const stampValue = typeof detail.metadata?.stamp === "string"
      ? detail.metadata.stamp
      : null;

    if (stampValue === "Exact") {
      return [
        { label: "Exact", tone: "exact" as const },
        { label: "+3 pts", tone: "points" as const },
      ];
    }

    if (stampValue === "Miss") {
      return [{ label: "Miss", tone: "miss" as const }];
    }

    if (detail.pointsAwarded === 1) {
      return [{ label: "+1 pt", tone: "points" as const }];
    }

    if (detail.pointsAwarded === 2) {
      return [{ label: "+2 pts", tone: "points" as const }];
    }

    if (detail.pointsAwarded === 3) {
      return [{ label: "+3 pts", tone: "points" as const }];
    }

    return [{ label: "Miss", tone: "miss" as const }];
  });

  return stamps.slice(0, limit);
}
