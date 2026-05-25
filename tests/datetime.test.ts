import { describe, expect, it } from "vitest";

import { formatKickoff } from "@/lib/utils/datetime";

describe("formatKickoff", () => {
  it("formats Europe/Madrid kickoff time with an explicit timezone", () => {
    expect(
      formatKickoff("2026-06-11T19:00:00Z", "Europe/Madrid"),
    ).toEqual({
      date: "11 jun",
      time: "21:00",
    });
  });

  it("formats America/Mexico_City using the runtime timezone offset", () => {
    expect(
      formatKickoff("2026-06-11T19:00:00Z", "America/Mexico_City"),
    ).toEqual({
      date: "11 jun",
      time: "13:00",
    });
  });
});
