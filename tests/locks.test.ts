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

  it("respects a manual unlock override even after kickoff", () => {
    const resolved = resolvePhaseLock({
      firstKickoff: "2026-06-11T19:00:00Z",
      lockAt: "2026-06-11T18:00:00Z",
      locked: false,
      lockedBy: "MANUAL",
      now: new Date("2026-06-11T20:00:00Z"),
      phase: "GROUP_STAGE",
    });

    expect(resolved.isLocked).toBe(false);
    expect(resolved.source).toBe("MANUAL");
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

  it("returns partial for a group with only some saved rows", () => {
    expect(
      resolvePredictionState({
        hasDirtyChanges: false,
        isLocked: false,
        savedCount: 2,
      }),
    ).toBe("PARTIAL");
  });

  it("returns needs review for recovered complete predictions", () => {
    expect(
      resolvePredictionState({
        hasDirtyChanges: false,
        hasRecoveredRows: true,
        isLocked: false,
        savedCount: 4,
      }),
    ).toBe("NEEDS_REVIEW");
  });

  it("returns locked before any pending or completed state", () => {
    expect(
      resolvePredictionState({
        hasDirtyChanges: true,
        isLocked: true,
        savedCount: 4,
      }),
    ).toBe("LOCKED");
  });
});
