import { describe, expect, it } from "vitest";

import { ONBOARDING_TOURS } from "@/lib/onboarding/tours";

describe("onboarding tours", () => {
  it("exports the five required tour ids", () => {
    expect(Object.keys(ONBOARDING_TOURS).sort()).toEqual([
      "home",
      "matches",
      "predictions",
      "profile",
      "ranking",
    ]);
  });

  it("defines the required fields for every step", () => {
    for (const [tourId, steps] of Object.entries(ONBOARDING_TOURS)) {
      expect(steps.length).toBeGreaterThan(0);

      for (const step of steps) {
        expect(step.target, `${tourId} target`).toBeTruthy();
        expect(step.title, `${tourId} title`).toBeTruthy();
        expect(step.description, `${tourId} description`).toBeTruthy();
      }
    }
  });
});
