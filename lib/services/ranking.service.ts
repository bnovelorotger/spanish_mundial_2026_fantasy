import type { SupabaseClient } from "@supabase/supabase-js";

import { getPointsBreakdownFromRows } from "./scoring.service";
import type {
  PointsBreakdown,
  PointsSourceType,
  RankingEntry,
  RankingModel,
  RankingStamp,
} from "../types/worldcup";

interface TeamAvatarRow {
  flag_url: string | null;
}

interface ProfileRow {
  avatar_team: TeamAvatarRow | TeamAvatarRow[] | null;
  avatar_team_code?: string | null;
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

interface StandingLiveStateRow {
  is_final: boolean;
}

function displayName(profile: ProfileRow) {
  return profile.display_name?.trim() || profile.username;
}

function normalizeAvatarTeam(
  value: TeamAvatarRow | TeamAvatarRow[] | null,
) {
  if (!value) {
    return null;
  }

  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function resolveAvatar(profile: ProfileRow) {
  if (profile.avatar_url) {
    return {
      avatarSource: "photo" as const,
      avatarUrl: profile.avatar_url,
    };
  }

  const teamAvatar = normalizeAvatarTeam(profile.avatar_team);

  if (profile.avatar_team_code && teamAvatar?.flag_url) {
    return {
      avatarSource: "team" as const,
      avatarUrl: teamAvatar.flag_url,
    };
  }

  return {
    avatarSource: null,
    avatarUrl: null,
  };
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

function pointsStampLabel(pointsAwarded: number) {
  switch (pointsAwarded) {
    case 1:
      return "+1 pto" as const;
    case 2:
      return "+2 pts" as const;
    case 3:
      return "+3 pts" as const;
    case 4:
      return "+4 pts" as const;
    case 6:
      return "+6 pts" as const;
    case 8:
      return "+8 pts" as const;
    case 15:
      return "+15 pts" as const;
    case 25:
      return "+25 pts" as const;
    default:
      return null;
  }
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
    const avatar = resolveAvatar(profile);

    return {
      avatarSource: avatar.avatarSource,
      avatarUrl: avatar.avatarUrl,
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
      .select(
        "id, username, display_name, avatar_url, avatar_team_code, created_at, avatar_team:teams!profiles_avatar_team_code_fkey(flag_url)",
      )
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

export function resolveRankingLiveState(
  standings: StandingLiveStateRow[],
) {
  return standings.some((standing) => standing.is_final === false);
}

async function loadRankingLiveState(supabase: SupabaseClient) {
  const response = await supabase
    .from("group_standings")
    .select("is_final");

  if (response.error) {
    throw new Error(`Could not load ranking live state: ${response.error.message}`);
  }

  return resolveRankingLiveState(response.data as StandingLiveStateRow[]);
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

export async function getRankingByPhase(
  supabase: SupabaseClient,
): Promise<RankingModel> {
  const [{ pointsRows, profiles }, isLive] = await Promise.all([
    loadProfilesAndPoints(supabase),
    loadRankingLiveState(supabase),
  ]);

  return {
    entries: buildRankingEntries(profiles, pointsRows),
    isLive,
  };
}

export async function getTopRanking(
  supabase: SupabaseClient,
  limit = 10,
) {
  const ranking = await getRankingByPhase(supabase);
  return ranking.entries.slice(0, limit);
}

export async function getUserRankingPosition(
  supabase: SupabaseClient,
  userId: string,
) {
  const ranking = await getRankingByPhase(supabase);
  return ranking.entries.find((entry) => entry.userId === userId) ?? null;
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
    return "Tu tabla de clasificación se iluminará en cuanto entren puntos en juego.";
  }

  if (currentUserEntry.position === 1) {
    return "Marcas el ritmo de toda la liga.";
  }

  const leader = ranking[0];
  const leaderName = leader ? displayName({
    avatar_team: null,
    avatar_team_code: null,
    avatar_url: leader.avatarUrl,
    created_at: leader.createdAt,
    display_name: leader.displayName,
    id: leader.userId,
    username: leader.username,
  }) : "el líder";

  return `Estás a ${currentUserEntry.gapToLeader} pts de ${leaderName}.`;
}

export function getRankingStamps(
  breakdown: PointsBreakdown,
  limit = 4,
): RankingStamp[] {
  const stamps = breakdown.details.slice(0, limit).flatMap<RankingStamp>((detail) => {
    const stampValue = typeof detail.metadata?.stamp === "string"
      ? detail.metadata.stamp
      : null;
    const predictionProvenance =
      typeof detail.metadata?.predictionProvenance === "string"
        ? detail.metadata.predictionProvenance
        : "USER_SUBMITTED";
    const provenanceStamp =
      predictionProvenance === "USER_SUBMITTED"
        ? []
        : [{ label: "Recuperado" as const, tone: "recovered" as const }];

    if (stampValue === "Exact") {
      return [
        { label: "Exacto", tone: "exact" as const },
        { label: "+3 pts", tone: "points" as const },
        ...provenanceStamp,
      ];
    }

    if (stampValue === "Miss") {
      return [{ label: "Fallo", tone: "miss" as const }, ...provenanceStamp];
    }

    const pointsLabel = pointsStampLabel(detail.pointsAwarded);

    if (pointsLabel) {
      return [
        { label: pointsLabel, tone: "points" as const },
        ...provenanceStamp,
      ];
    }

    return [{ label: "Fallo", tone: "miss" as const }, ...provenanceStamp];
  });

  return stamps.slice(0, limit);
}
