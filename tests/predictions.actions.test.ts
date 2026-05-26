import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/lib/services/bracket.service", () => ({
  parseKnockoutPredictionFormData: vi.fn(),
  saveKnockoutPrediction: vi.fn(),
}));

vi.mock("@/lib/services/profile.service", () => ({
  ensureProfileForUser: vi.fn(),
}));

vi.mock("@/lib/services/predictions.service", () => ({
  parseGroupPredictionFormData: vi.fn(),
  saveGroupPrediction: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { buildPredictionsRedirectHref } from "@/app/(protected)/predictions/redirect";

describe("buildPredictionsRedirectHref", () => {
  it("builds a group redirect with a section hash", () => {
    expect(
      buildPredictionsRedirectHref(
        {
          group: "C",
          saved: "1",
          tab: "groups",
        },
        "grupo-c",
      ),
    ).toBe("/predictions?group=C&saved=1&tab=groups#grupo-c");
  });

  it("builds a knockout redirect with a match hash", () => {
    expect(
      buildPredictionsRedirectHref(
        {
          match: "65",
          tab: "knockout",
        },
        "match-65",
      ),
    ).toBe("/predictions?match=65&tab=knockout#match-65");
  });
});
