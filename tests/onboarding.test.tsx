import { describe, expect, it, vi } from "vitest";

import {
  ONBOARDING_TOURS,
} from "@/lib/onboarding/tours";
import {
  persistOnboardingResult,
} from "@/components/onboarding/OnboardingTour";

describe("onboarding tours", () => {
  it("exports the required tour ids, including both predictions tours", () => {
    expect(Object.keys(ONBOARDING_TOURS).sort()).toEqual([
      "home",
      "matches",
      "predictions-groups",
      "predictions-knockout",
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

  it("does not persist done when a tour never showed a real step", () => {
    const setItem = vi.fn();

    const result = persistOnboardingResult({
      shownStepCount: 0,
      skippedAtStorageKey: "onboarding:predictions-groups:skippedAt",
      status: "missing-targets",
      storage: {
        setItem,
      },
      storageKey: "onboarding:predictions-groups",
    });

    expect(result).toBe("incomplete");
    expect(setItem).not.toHaveBeenCalled();
  });

  it("persists done when at least one real step was shown before later targets disappeared", () => {
    const setItem = vi.fn();

    const result = persistOnboardingResult({
      shownStepCount: 1,
      skippedAtStorageKey: "onboarding:predictions-groups:skippedAt",
      status: "missing-targets",
      storage: {
        setItem,
      },
      storageKey: "onboarding:predictions-groups",
    });

    expect(result).toBe("done");
    expect(setItem).toHaveBeenCalledWith("onboarding:predictions-groups", "done");
  });

  it("does not leave English podium copy in any tour step", () => {
    const leakedWords = /\b(gold|silver|bronze)\b/i;

    for (const steps of Object.values(ONBOARDING_TOURS)) {
      for (const step of steps) {
        expect(step.title).not.toMatch(leakedWords);
        expect(step.description).not.toMatch(leakedWords);
      }
    }
  });
});
