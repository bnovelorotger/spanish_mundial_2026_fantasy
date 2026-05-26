import type { SupabaseClient, User } from "@supabase/supabase-js";

import { createAdminClient } from "@/lib/supabase/admin";

export interface ProfileRecord {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  avatar_team_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProfileFormData {
  displayName: string;
  username: string;
}

const PROFILE_COLUMNS =
  "id, username, display_name, avatar_url, avatar_team_code, created_at, updated_at";
const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

function toProfileRecord(value: unknown): ProfileRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;

  if (
    typeof candidate.id !== "string" ||
    typeof candidate.username !== "string" ||
    typeof candidate.created_at !== "string" ||
    typeof candidate.updated_at !== "string"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    username: candidate.username,
    display_name:
      typeof candidate.display_name === "string" ? candidate.display_name : null,
    avatar_url:
      typeof candidate.avatar_url === "string" ? candidate.avatar_url : null,
    avatar_team_code:
      typeof candidate.avatar_team_code === "string"
        ? candidate.avatar_team_code
        : null,
    created_at: candidate.created_at,
    updated_at: candidate.updated_at,
  };
}

function titleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function emailLocalPart(email: string | undefined) {
  return email?.split("@")[0] ?? "";
}

function resolveDisplayNameSeed(user: User) {
  const metadata = user.user_metadata;
  const metadataDisplayName =
    typeof metadata?.display_name === "string"
      ? metadata.display_name
      : typeof metadata?.full_name === "string"
        ? metadata.full_name
        : typeof metadata?.name === "string"
          ? metadata.name
          : "";

  const fallback = emailLocalPart(user.email)
    .replace(/[._-]+/g, " ")
    .trim();

  return titleCase((metadataDisplayName || fallback || "Jugador del Mundial").trim());
}

export function normalizeUsername(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
}

function resolveUsernameSeed(user: User) {
  const metadata = user.user_metadata;
  const metadataUsername =
    typeof metadata?.username === "string" ? metadata.username : "";

  const fallback = emailLocalPart(user.email);

  return normalizeUsername(metadataUsername || fallback || "player");
}

function formatDisplayName(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

async function getProfileByUserId(
  adminClient: SupabaseClient,
  userId: string,
): Promise<ProfileRecord | null> {
  const { data, error } = await adminClient
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Could not load profile: ${error.message}`);
  }

  return toProfileRecord(data);
}

async function isUsernameAvailable(
  adminClient: SupabaseClient,
  username: string,
  excludedUserId?: string,
) {
  let query = adminClient
    .from("profiles")
    .select("id")
    .eq("username", username)
    .limit(1);

  if (excludedUserId) {
    query = query.neq("id", excludedUserId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new Error(`Could not validate username: ${error.message}`);
  }

  return data === null;
}

async function generateUniqueUsername(
  adminClient: SupabaseClient,
  user: User,
  excludedUserId?: string,
) {
  const base = resolveUsernameSeed(user) || "player";
  const suffix = user.id.replace(/-/g, "").slice(0, 6);
  const candidates = [base, `${base}_${suffix}`];

  for (const candidate of candidates) {
    if (USERNAME_PATTERN.test(candidate)) {
      const available = await isUsernameAvailable(
        adminClient,
        candidate,
        excludedUserId,
      );

      if (available) {
        return candidate;
      }
    }
  }

  for (let index = 1; index <= 20; index += 1) {
    const numberedCandidate = normalizeUsername(`${base}_${index}`);
    const available = await isUsernameAvailable(
      adminClient,
      numberedCandidate,
      excludedUserId,
    );

    if (available && USERNAME_PATTERN.test(numberedCandidate)) {
      return numberedCandidate;
    }
  }

  return `player_${suffix}`;
}

export function validateProfileFormData(
  username: string,
  displayName: string,
):
  | {
      data: ProfileFormData;
      error?: undefined;
    }
  | {
      data?: undefined;
      error: string;
    } {
  const normalizedUsername = normalizeUsername(username);
  const normalizedDisplayName = formatDisplayName(displayName);

  if (!USERNAME_PATTERN.test(normalizedUsername)) {
    return {
      error:
        "El nombre de usuario debe tener entre 3 y 24 caracteres y usar solo letras, números o guiones bajos.",
    };
  }

  if (normalizedDisplayName.length < 2 || normalizedDisplayName.length > 50) {
    return {
      error: "El nombre visible debe tener entre 2 y 50 caracteres.",
    };
  }

  return {
    data: {
      displayName: normalizedDisplayName,
      username: normalizedUsername,
    },
  };
}

export function isProfileComplete(profile: ProfileRecord) {
  return (
    USERNAME_PATTERN.test(profile.username) &&
    typeof profile.display_name === "string" &&
    profile.display_name.trim().length >= 2
  );
}

export async function ensureProfileForUser(user: User) {
  const adminClient = createAdminClient();
  const existingProfile = await getProfileByUserId(adminClient, user.id);

  if (existingProfile) {
    return existingProfile;
  }

  const username = await generateUniqueUsername(adminClient, user, user.id);
  const displayName = resolveDisplayNameSeed(user);

  const { data, error } = await adminClient
    .from("profiles")
    .insert({
      display_name: displayName,
      id: user.id,
      username,
    })
    .select(PROFILE_COLUMNS)
    .single();

  if (error) {
    const concurrentProfile = await getProfileByUserId(adminClient, user.id);

    if (concurrentProfile) {
      return concurrentProfile;
    }

    throw new Error(`Could not create profile: ${error.message}`);
  }

  const profile = toProfileRecord(data);

  if (!profile) {
    throw new Error("Profile creation returned an invalid response.");
  }

  return profile;
}

export async function usernameExistsForOtherUser(
  username: string,
  userId: string,
) {
  const adminClient = createAdminClient();
  return !(await isUsernameAvailable(adminClient, username, userId));
}

async function updateProfileAvatarFields(
  supabase: Pick<SupabaseClient, "from">,
  userId: string,
  values: {
    avatar_team_code: string | null;
    avatar_url: string | null;
  },
) {
  const { error } = await supabase
    .from("profiles")
    .update(values)
    .eq("id", userId);

  if (error) {
    throw new Error(`Could not update profile avatar: ${error.message}`);
  }
}

export async function setProfileAvatarFromTeam(
  supabase: Pick<SupabaseClient, "from">,
  userId: string,
  teamCode: string,
) {
  await updateProfileAvatarFields(supabase, userId, {
    avatar_team_code: teamCode,
    avatar_url: null,
  });
}

export async function setProfileAvatarFromUpload(
  supabase: Pick<SupabaseClient, "from" | "storage">,
  userId: string,
  storagePath: string,
) {
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(storagePath);

  await updateProfileAvatarFields(supabase, userId, {
    avatar_team_code: null,
    avatar_url: publicUrl,
  });
}

export async function clearProfileAvatar(
  supabase: Pick<SupabaseClient, "from">,
  userId: string,
) {
  await updateProfileAvatarFields(supabase, userId, {
    avatar_team_code: null,
    avatar_url: null,
  });
}
