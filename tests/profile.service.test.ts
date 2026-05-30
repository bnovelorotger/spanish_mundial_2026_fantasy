import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import {
  clearProfileAvatar,
  isProfileComplete,
  normalizeUsername,
  setProfileAvatarFromTeam,
  setProfileAvatarFromUpload,
  validateProfileFormData,
} from "@/lib/services/profile.service";

function createProfileUpdateClient() {
  const eq = vi.fn().mockResolvedValue({ error: null });
  const update = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ update }));
  const getPublicUrl = vi.fn((path: string) => ({
    data: {
      publicUrl: `https://dzvwgffjheyknrilwrvh.supabase.co/storage/v1/object/public/avatars/${path}`,
    },
  }));
  const storageFrom = vi.fn(() => ({ getPublicUrl }));

  return {
    client: {
      from,
      storage: {
        from: storageFrom,
      },
    },
    eq,
    from,
    getPublicUrl,
    storageFrom,
    update,
  };
}

describe("normalizeUsername", () => {
  it("normalizes casing, spacing, and separators", () => {
    expect(normalizeUsername("  Carlos. De-la_Fuente  ")).toBe(
      "carlos_de_la_fuente",
    );
  });
});

describe("validateProfileFormData", () => {
  it("returns normalized profile data when valid", () => {
    expect(validateProfileFormData("  Ana.Maria  ", "  Ana   Maria ")).toEqual({
      data: {
        displayName: "Ana Maria",
        username: "ana_maria",
      },
    });
  });

  it("rejects invalid usernames", () => {
    expect(validateProfileFormData("??", "Ana Maria")).toEqual({
      error:
        "El nombre de usuario debe tener entre 3 y 24 caracteres y usar solo letras, números o guiones bajos.",
    });
  });
});

describe("profile avatar updates", () => {
  it("setProfileAvatarFromTeam writes avatar_team_code and clears avatar_url", async () => {
    const { client, eq, update } = createProfileUpdateClient();

    await setProfileAvatarFromTeam(client, "user-1", "ESP");

    expect(update).toHaveBeenCalledWith({
      avatar_team_code: "ESP",
      avatar_url: null,
    });
    expect(eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("setProfileAvatarFromUpload writes avatar_url and clears avatar_team_code", async () => {
    const { client, eq, getPublicUrl, storageFrom, update } = createProfileUpdateClient();

    await setProfileAvatarFromUpload(client, "user-1", "user-1/avatar.webp");

    expect(storageFrom).toHaveBeenCalledWith("avatars");
    expect(getPublicUrl).toHaveBeenCalledWith("user-1/avatar.webp");

    // The service appends a cache-busting `?v=<timestamp>` query string so
    // re-uploads to the same path force the browser and the CDN to fetch
    // the new bytes. Assert the URL shape without locking in a specific
    // timestamp.
    expect(update).toHaveBeenCalledTimes(1);
    const updateArgs = update.mock.calls[0]?.[0] as {
      avatar_team_code: string | null;
      avatar_url: string | null;
    };
    expect(updateArgs.avatar_team_code).toBeNull();
    expect(updateArgs.avatar_url).toMatch(
      /^https:\/\/dzvwgffjheyknrilwrvh\.supabase\.co\/storage\/v1\/object\/public\/avatars\/user-1\/avatar\.webp\?v=\d+$/,
    );

    expect(eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("clearProfileAvatar clears both avatar fields", async () => {
    const { client, eq, update } = createProfileUpdateClient();

    await clearProfileAvatar(client, "user-1");

    expect(update).toHaveBeenCalledWith({
      avatar_team_code: null,
      avatar_url: null,
    });
    expect(eq).toHaveBeenCalledWith("id", "user-1");
  });
});

describe("isProfileComplete", () => {
  it("requires a valid username and non-empty display name", () => {
    expect(
      isProfileComplete({
        avatar_team_code: null,
        avatar_url: null,
        created_at: "2026-06-01T00:00:00Z",
        display_name: "Ana Maria",
        id: "user-1",
        updated_at: "2026-06-01T00:00:00Z",
        username: "ana_maria",
      }),
    ).toBe(true);

    expect(
      isProfileComplete({
        avatar_team_code: null,
        avatar_url: null,
        created_at: "2026-06-01T00:00:00Z",
        display_name: " ",
        id: "user-2",
        updated_at: "2026-06-01T00:00:00Z",
        username: "bad name",
      }),
    ).toBe(false);
  });
});
