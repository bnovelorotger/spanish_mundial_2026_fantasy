import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

import {
  isProfileComplete,
  normalizeUsername,
  validateProfileFormData,
} from "@/lib/services/profile.service";

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
        "Username must be 3-24 characters and use only letters, numbers, or underscores.",
    });
  });
});

describe("isProfileComplete", () => {
  it("requires a valid username and non-empty display name", () => {
    expect(
      isProfileComplete({
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
