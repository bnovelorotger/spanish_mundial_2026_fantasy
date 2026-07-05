import { describe, expect, it } from "vitest";

import { mockMatches } from "@/lib/providers/mock-worldcup-provider";
import { StaticWorldCupProvider } from "@/lib/providers/static-worldcup-provider";

function range(start: number, end: number) {
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

function getMatchPlaceholder(
  matchNumber: number,
  side: "home_placeholder" | "away_placeholder",
) {
  return mockMatches.find((match) => match.match_number === matchNumber)?.[side] ?? null;
}

describe("mock/static knockout fixtures", () => {
  it("uses the official knockout numbering instead of the legacy 30-36 bracket", () => {
    const knockoutMatchNumbers = mockMatches
      .filter((match) => match.phase !== "GROUP_STAGE")
      .map((match) => match.match_number);

    expect(knockoutMatchNumbers).toEqual([
      ...range(73, 88),
      ...range(89, 96),
      ...range(97, 100),
      101,
      102,
      103,
      104,
    ]);
    expect(knockoutMatchNumbers).not.toEqual(
      expect.arrayContaining(range(30, 36)),
    );
  });

  it("exposes official stage-two placeholders for the mock provider", () => {
    expect(getMatchPlaceholder(97, "home_placeholder")).toBe("Winner Match 89");
    expect(getMatchPlaceholder(97, "away_placeholder")).toBe("Winner Match 90");
    expect(getMatchPlaceholder(98, "home_placeholder")).toBe("Winner Match 93");
    expect(getMatchPlaceholder(98, "away_placeholder")).toBe("Winner Match 94");
    expect(getMatchPlaceholder(99, "home_placeholder")).toBe("Winner Match 91");
    expect(getMatchPlaceholder(99, "away_placeholder")).toBe("Winner Match 92");
    expect(getMatchPlaceholder(100, "home_placeholder")).toBe("Winner Match 95");
    expect(getMatchPlaceholder(100, "away_placeholder")).toBe("Winner Match 96");
    expect(getMatchPlaceholder(101, "home_placeholder")).toBe("Winner Match 97");
    expect(getMatchPlaceholder(101, "away_placeholder")).toBe("Winner Match 98");
    expect(getMatchPlaceholder(102, "home_placeholder")).toBe("Winner Match 99");
    expect(getMatchPlaceholder(102, "away_placeholder")).toBe("Winner Match 100");
    expect(getMatchPlaceholder(104, "home_placeholder")).toBe("Winner Match 101");
    expect(getMatchPlaceholder(104, "away_placeholder")).toBe("Winner Match 102");
  });

  it("keeps the static provider aligned with the same official knockout topology", async () => {
    const provider = new StaticWorldCupProvider();
    const staticMatches = await provider.getMatches();

    const staticKnockout = staticMatches
      .filter((match) => match.phase !== "GROUP_STAGE")
      .map((match) => ({
        away_placeholder: match.away_placeholder ?? null,
        home_placeholder: match.home_placeholder ?? null,
        match_number: match.match_number,
        phase: match.phase,
      }));
    const mockKnockout = mockMatches
      .filter((match) => match.phase !== "GROUP_STAGE")
      .map((match) => ({
        away_placeholder: match.away_placeholder ?? null,
        home_placeholder: match.home_placeholder ?? null,
        match_number: match.match_number,
        phase: match.phase,
      }));

    expect(staticKnockout).toEqual(mockKnockout);
  });
});
