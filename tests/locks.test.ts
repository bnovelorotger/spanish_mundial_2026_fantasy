import { describe, expect, it } from "vitest";

import { resolvePhaseLock, resolvePredictionState } from "@/lib/utils/locks";

describe("resolvePhaseLock", () => {
  it("respects a manual lock override", () => {
    const resolved = resolvePhaseLock({
      firstKickoff: "2026-06-11T19:00:00Z",
      lockAt: "2026-06-11T18:00:00Z",
      locked: true,
      lockedBy: "MANUAL",
      now: new Date("2026-06-10T10:00:00Z"),
      phase: "GROUP_STAGE",
    });

    expect(resolved.isLocked).toBe(true);
    expect(resolved.source).toBe("MANUAL");
  });

  it("locks automatically once the first kickoff has started", () => {
    const resolved = resolvePhaseLock({
      firstKickoff: "2026-06-11T19:00:00Z",
      lockAt: null,
      locked: false,
      lockedBy: null,
      now: new Date("2026-06-11T19:00:01Z"),
      phase: "GROUP_STAGE",
    });

    expect(resolved.isLocked).toBe(true);
    expect(resolved.effectiveLockAt).toBe("2026-06-11T19:00:00Z");
    expect(resolved.source).toBe("AUTOMATIC");
  });
});

describe("resolvePredictionState", () => {
  it("returns pending when the user has unsaved changes", () => {
    expect(
      resolvePredictionState({
        hasDirtyChanges: true,
        isLocked: false,
        savedCount: 4,
      }),
    ).toBe("PENDING");
  });

  it("returns completed for a saved unlocked group", () => {
    expect(
      resolvePredictionState({
        hasDirtyChanges: false,
        isLocked: false,
        savedCount: 4,
      }),
    ).toBe("COMPLETED");
  });
});
