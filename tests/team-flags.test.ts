import { describe, expect, it } from "vitest";

import { getFlagUrlForTeamCode } from "@/lib/providers/team-flags";

describe("getFlagUrlForTeamCode", () => {
  it("returns a stable flagcdn url for known real teams", () => {
    expect(getFlagUrlForTeamCode("MEX")).toBe("https://flagcdn.com/w80/mx.png");
    expect(getFlagUrlForTeamCode("usa")).toBe("https://flagcdn.com/w80/us.png");
  });

  it("returns undefined for TBD placeholders", () => {
    expect(getFlagUrlForTeamCode("TBD", true)).toBeUndefined();
    expect(getFlagUrlForTeamCode("TBA")).toBeUndefined();
  });
});
