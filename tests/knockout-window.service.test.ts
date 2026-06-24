import { describe, expect, it } from "vitest";

import {
  KNOCKOUT_WINDOW_ALERT_LEAD_HOURS,
  getCurrentKnockoutWindowSummary,
  getKnockoutAlertSummary,
  getKnockoutWindowStateForRound,
} from "@/lib/services/knockout-window.service";

const stageOneLock = {
  effectiveLockAt: "2026-07-01T19:00:00Z",
  isLocked: false,
  phase: "KNOCKOUT_STAGE_ONE" as const,
  source: "AUTOMATIC" as const,
};

const stageTwoLock = {
  effectiveLockAt: "2026-07-09T19:00:00Z",
  isLocked: false,
  phase: "KNOCKOUT_STAGE_TWO" as const,
  source: "AUTOMATIC" as const,
};

describe("getCurrentKnockoutWindowSummary", () => {
  it("returns stage one until the first knockout window closes", () => {
    expect(
      getCurrentKnockoutWindowSummary({
        stageOne: stageOneLock,
        stageTwo: stageTwoLock,
      }),
    ).toMatchObject({
      label: "Ventana 1",
      roundsLabel: "Dieciseisavos y octavos",
    });
  });

  it("switches to stage two after stage one locks", () => {
    expect(
      getCurrentKnockoutWindowSummary({
        stageOne: { ...stageOneLock, isLocked: true },
        stageTwo: stageTwoLock,
      }),
    ).toMatchObject({
      label: "Ventana 2",
      roundsLabel: "Cuartos, semifinales y final",
    });
  });
});

describe("getKnockoutAlertSummary", () => {
  it("activates the floating notice inside the 24h lead time", () => {
    const alert = getKnockoutAlertSummary({
      now: new Date("2026-06-30T20:00:00Z"),
      stageOne: stageOneLock,
      stageTwo: stageTwoLock,
    });

    expect(alert).toMatchObject({
      isAlertActive: true,
      leadHours: KNOCKOUT_WINDOW_ALERT_LEAD_HOURS,
      phase: "KNOCKOUT_STAGE_ONE",
    });
  });

  it("hides the notice after the window closes", () => {
    expect(
      getKnockoutAlertSummary({
        now: new Date("2026-07-01T19:00:01Z"),
        stageOne: { ...stageOneLock, isLocked: true },
        stageTwo: stageTwoLock,
      }),
    ).toBeNull();
  });
});

describe("getKnockoutWindowStateForRound", () => {
  it("keeps quarter-finals upcoming until stage one is closed", () => {
    expect(
      getKnockoutWindowStateForRound({
        phase: "QUARTER_FINALS",
        stageOne: stageOneLock,
        stageTwo: stageTwoLock,
      }),
    ).toBe("UPCOMING");
  });

  it("opens quarter-finals once the second window becomes active", () => {
    expect(
      getKnockoutWindowStateForRound({
        phase: "QUARTER_FINALS",
        stageOne: { ...stageOneLock, isLocked: true },
        stageTwo: stageTwoLock,
      }),
    ).toBe("EDITABLE");
  });
});
