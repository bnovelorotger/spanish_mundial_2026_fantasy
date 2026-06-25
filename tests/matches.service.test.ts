import { describe, expect, it } from "vitest";

import {
  isGroupLetter,
  isMatchPhase,
  normalizeMatchFilters,
} from "@/lib/services/matches.service";
import { isRtveBroadcastMatchNumber } from "@/lib/utils/rtve-broadcasts";

describe("isMatchPhase", () => {
  it("accepts only supported tournament phases", () => {
    expect(isMatchPhase("GROUP_STAGE")).toBe(true);
    expect(isMatchPhase("FINAL")).toBe(true);
    expect(isMatchPhase("FRIENDLY")).toBe(false);
  });
});

describe("isGroupLetter", () => {
  it("accepts groups A through L only", () => {
    expect(isGroupLetter("A")).toBe(true);
    expect(isGroupLetter("L")).toBe(true);
    expect(isGroupLetter("M")).toBe(false);
  });
});

describe("normalizeMatchFilters", () => {
  it("keeps valid phase and group filters", () => {
    expect(
      normalizeMatchFilters({
        group: "C",
        phase: "ROUND_OF_16",
      }),
    ).toEqual({
      group: "C",
      phase: "ROUND_OF_16",
    });
  });

  it("falls back invalid filters to ALL", () => {
    expect(
      normalizeMatchFilters({
        group: "Z",
        phase: "FRIENDLY",
      }),
    ).toEqual({
      group: "ALL",
      phase: "ALL",
    });
  });
});

describe("isRtveBroadcastMatchNumber", () => {
  it("flags the static RTVE broadcast matches", () => {
    expect(isRtveBroadcastMatchNumber(55)).toBe(true);
    expect(isRtveBroadcastMatchNumber(63)).toBe(true);
    expect(isRtveBroadcastMatchNumber(69)).toBe(true);
  });

  it("keeps non-broadcast fixtures unflagged", () => {
    expect(isRtveBroadcastMatchNumber(54)).toBe(false);
    expect(isRtveBroadcastMatchNumber(70)).toBe(false);
  });
});
