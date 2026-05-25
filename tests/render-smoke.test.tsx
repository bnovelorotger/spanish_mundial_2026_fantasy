import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  BracketMatchViewModel,
  MatchCardViewModel,
} from "@/lib/types/worldcup";

const {
  mockCreateClient,
  mockGetNextOpenLock,
  mockGetNextScheduledMatch,
  mockGetRankingByPhase,
  mockGetUserPointsBreakdown,
  mockGetUserGapCopy,
  mockGetRankingStamps,
} = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockGetNextOpenLock: vi.fn(),
  mockGetNextScheduledMatch: vi.fn(),
  mockGetRankingByPhase: vi.fn(),
  mockGetUserPointsBreakdown: vi.fn(),
  mockGetUserGapCopy: vi.fn(),
  mockGetRankingStamps: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/lib/services/locks.service", () => ({
  getNextOpenLock: mockGetNextOpenLock,
}));

vi.mock("@/lib/services/matches.service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/matches.service")>(
    "@/lib/services/matches.service",
  );

  return {
    ...actual,
    getNextScheduledMatch: mockGetNextScheduledMatch,
  };
});

vi.mock("@/lib/services/ranking.service", () => ({
  getRankingByPhase: mockGetRankingByPhase,
  getRankingStamps: mockGetRankingStamps,
  getUserGapCopy: mockGetUserGapCopy,
  getUserPointsBreakdown: mockGetUserPointsBreakdown,
}));

import DashboardPage from "@/app/(protected)/dashboard/page";
import { BracketPredictionEditor } from "@/components/worldcup/BracketPredictionEditor";
import { MatchCard } from "@/components/worldcup/MatchCard";

const nextMatch: MatchCardViewModel = {
  awayPlaceholder: null,
  awayScore: null,
  awayTeam: {
    code: "USA",
    flagUrl: "https://flagcdn.com/w80/us.png",
    isTbd: false,
    name: "United States",
  },
  city: "Mexico City",
  groupLetter: "A",
  homePlaceholder: null,
  homeScore: null,
  homeTeam: {
    code: "MEX",
    flagUrl: "https://flagcdn.com/w80/mx.png",
    isTbd: false,
    name: "Mexico",
  },
  id: "match-1",
  kickoff: "2026-06-11T19:00:00Z",
  matchNumber: 1,
  phase: "GROUP_STAGE",
  status: "SCHEDULED",
  venue: "Estadio Azteca",
};

const bracketMatch: BracketMatchViewModel = {
  awaySlot: {
    code: "USA",
    flagUrl: "https://flagcdn.com/w80/us.png",
    id: "team-2",
    isKnown: true,
    isTbd: false,
    name: "United States",
  },
  canPredict: true,
  city: "Los Angeles",
  homeSlot: {
    code: "MEX",
    flagUrl: "https://flagcdn.com/w80/mx.png",
    id: "team-1",
    isKnown: true,
    isTbd: false,
    name: "Mexico",
  },
  id: "bracket-match-1",
  isFinal: false,
  kickoff: "2026-07-01T19:00:00Z",
  lock: {
    effectiveLockAt: "2026-07-01T19:00:00Z",
    isLocked: false,
    phase: "ROUND_OF_32",
    source: "AUTOMATIC",
  },
  matchNumber: 65,
  phase: "ROUND_OF_32",
  prediction: null,
  venue: "SoFi Stadium",
};

describe("render smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: null,
          },
        }),
      },
    });
    mockGetNextOpenLock.mockResolvedValue({
      lock_at: "2026-06-11T19:00:00Z",
      locked: false,
      locked_by: "AUTOMATIC",
      phase: "GROUP_STAGE",
    });
    mockGetNextScheduledMatch.mockResolvedValue(nextMatch);
    mockGetRankingByPhase.mockResolvedValue(null);
    mockGetUserPointsBreakdown.mockResolvedValue(null);
    mockGetUserGapCopy.mockReturnValue("Gap copy");
    mockGetRankingStamps.mockReturnValue([]);
  });

  it("renders the dashboard without throwing when nextMatch exists", async () => {
    const markup = renderToStaticMarkup(await DashboardPage());

    expect(markup).toContain("Next match");
    expect(markup).toContain("Mexico");
    expect(markup).toContain("Jun 11");
    expect(markup).toContain("21:00");
  });

  it("renders MatchCard without throwing", () => {
    const markup = renderToStaticMarkup(
      <MatchCard match={nextMatch} variant="premium" />,
    );

    expect(markup).toContain("Mexico");
    expect(markup).toContain("Jun 11");
  });

  it("renders BracketPredictionEditor without throwing", () => {
    const markup = renderToStaticMarkup(
      <BracketPredictionEditor
        match={bracketMatch}
        saveAction={async () => {}}
      />,
    );

    expect(markup).toContain("Match #65");
    expect(markup).toContain("Jul 1");
  });
});
