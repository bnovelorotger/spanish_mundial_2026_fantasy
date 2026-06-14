import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  BracketMatchViewModel,
  BracketRoundViewModel,
  GroupPredictionGroupViewModel,
  MatchCardViewModel,
  RankingEntry,
} from "@/lib/types/worldcup";
import { GROUP_LETTER_OPTIONS } from "@/lib/types/worldcup";

const {
  mockCreateClient,
  mockGetNextOpenLock,
  mockGetNextScheduledMatch,
  mockGetRankingByPhase,
  mockGetUserPointsBreakdown,
  mockGetUserGapCopy,
  mockGetRankingStamps,
  mockGetGroupPredictionGroups,
  mockGetBracketRounds,
} = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockGetNextOpenLock: vi.fn(),
  mockGetNextScheduledMatch: vi.fn(),
  mockGetRankingByPhase: vi.fn(),
  mockGetUserPointsBreakdown: vi.fn(),
  mockGetUserGapCopy: vi.fn(),
  mockGetRankingStamps: vi.fn(),
  mockGetGroupPredictionGroups: vi.fn(),
  mockGetBracketRounds: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

vi.mock("@/lib/services/locks.service", () => ({
  getNextOpenLock: mockGetNextOpenLock,
}));

vi.mock("@/lib/services/profile.service", () => ({
  ensureProfileForUser: vi.fn(),
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

vi.mock("@/lib/services/predictions.service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/predictions.service")>(
    "@/lib/services/predictions.service",
  );

  return {
    ...actual,
    getGroupPredictionGroups: mockGetGroupPredictionGroups,
  };
});

vi.mock("@/lib/services/bracket.service", async () => {
  const actual = await vi.importActual<typeof import("@/lib/services/bracket.service")>(
    "@/lib/services/bracket.service",
  );

  return {
    ...actual,
    getBracketRounds: mockGetBracketRounds,
  };
});

vi.mock("@/lib/services/ranking.service", () => ({
  getRankingByPhase: mockGetRankingByPhase,
  getRankingStamps: mockGetRankingStamps,
  getUserGapCopy: mockGetUserGapCopy,
  getUserPointsBreakdown: mockGetUserPointsBreakdown,
}));

import DashboardPage from "@/app/(protected)/dashboard/page";
import PredictionsPage from "@/app/(protected)/predictions/page";
import { BracketPredictionEditor } from "@/components/worldcup/BracketPredictionEditor";
import { MatchCard } from "@/components/worldcup/MatchCard";
import { RankingTable } from "@/components/worldcup/RankingTable";

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

const rankingEntries: RankingEntry[] = [
  {
    avatarSource: "photo",
    avatarUrl:
      "https://dzvwgffjheyknrilwrvh.supabase.co/storage/v1/object/public/avatars/user-1/avatar.webp",
    championPoints: 0,
    createdAt: "2026-06-01T00:00:00Z",
    displayName: "Ana",
    gapToLeader: 0,
    gapToPrevious: null,
    groupPoints: 9,
    knockoutPoints: 0,
    position: 1,
    totalPoints: 9,
    userId: "user-1",
    username: "ana",
  },
  {
    avatarSource: "team",
    avatarUrl: "https://crests.football-data.org/760.svg",
    championPoints: 0,
    createdAt: "2026-06-02T00:00:00Z",
    displayName: "Bruno",
    gapToLeader: 3,
    gapToPrevious: 3,
    groupPoints: 6,
    knockoutPoints: 0,
    position: 2,
    totalPoints: 6,
    userId: "user-2",
    username: "bruno",
  },
];

const predictionGroups: GroupPredictionGroupViewModel[] = GROUP_LETTER_OPTIONS.map(
  (letter) => ({
    groupLetter: letter,
    hasRecoveredRows: false,
    isPartial: false,
    lock: {
      effectiveLockAt: "2026-06-11T19:00:00Z",
      isLocked: letter === "D",
      phase: "GROUP_STAGE",
      source: "AUTOMATIC",
    },
    savedCount: letter === "A" ? 4 : 0,
    state: letter === "D" ? "LOCKED" : letter === "A" ? "COMPLETED" : "PENDING",
    teams:
      letter === "L"
        ? []
        : Array.from({ length: 4 }, (_, teamIndex) => ({
            code: `${letter}${teamIndex + 1}`,
            confirmedAt: null,
            flagUrl: null,
            id: `${letter.toLowerCase()}-team-${teamIndex + 1}`,
            isTbd: false,
            name: `Team ${letter}${teamIndex + 1}`,
            predictedPosition: teamIndex + 1,
            provenance: "USER_SUBMITTED",
            provenanceNote: null,
          })),
  }),
);

const bracketRounds: BracketRoundViewModel[] = [
  {
    label: "Dieciseisavos de final",
    matches: [bracketMatch],
    phase: "ROUND_OF_32",
  },
];

describe("render smoke", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: {
            user: {
              email: "ana@example.com",
              id: "user-1",
            },
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
    mockGetRankingByPhase.mockResolvedValue({
      entries: rankingEntries,
      isLive: true,
    });
    mockGetUserPointsBreakdown.mockResolvedValue({
      champion: 0,
      details: [],
      groupStage: 9,
      knockout: 0,
      total: 9,
    });
    mockGetUserGapCopy.mockReturnValue("Marcas el ritmo de toda la liga.");
    mockGetRankingStamps.mockReturnValue([]);
    mockGetGroupPredictionGroups.mockResolvedValue(predictionGroups);
    mockGetBracketRounds.mockResolvedValue(bracketRounds);
  });

  it("renders the dashboard without throwing when nextMatch exists", async () => {
    const markup = renderToStaticMarkup(await DashboardPage());

    expect(markup).toContain("Próximo partido");
    expect(markup).toContain("Mexico");
    expect(markup).toContain("11 jun");
    expect(markup).toContain("21:00");
    expect(markup).toContain("dzvwgffjheyknrilwrvh.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Favatars%2Fuser-1%2Favatar.webp");
  });

  it("renders MatchCard without throwing", () => {
    const markup = renderToStaticMarkup(
      <MatchCard match={nextMatch} variant="premium" />,
    );

    expect(markup).toContain("Mexico");
    expect(markup).toContain("11 jun");
  });

  it("renders BracketPredictionEditor without throwing", () => {
    const markup = renderToStaticMarkup(
      <BracketPredictionEditor
        match={bracketMatch}
        saveAction={async () => {}}
      />,
    );

    expect(markup).toContain("Partido #65");
    expect(markup).toContain('id="match-bracket-match-1"');
    expect(markup).toContain("21:00");
  });

  it("renders ranking avatars for uploaded photos and team crests", () => {
    const markup = renderToStaticMarkup(
      <RankingTable currentUserId="user-1" entries={rankingEntries} />,
    );

    expect(markup).toContain("dzvwgffjheyknrilwrvh.supabase.co%2Fstorage%2Fv1%2Fobject%2Fpublic%2Favatars%2Fuser-1%2Favatar.webp");
    expect(markup).toContain("crests.football-data.org/760.svg");
  });

  it("renders the groups tab with a 12-chip group navigator and anchored sections", async () => {
    const markup = renderToStaticMarkup(
      await PredictionsPage({
        searchParams: Promise.resolve({
          group: "C",
          tab: "groups",
        }),
      }),
    );

    expect(markup).toContain('data-testid="group-navigator"');
    expect(markup.match(/data-group-nav-chip=/g) ?? []).toHaveLength(12);
    expect(markup).toContain('id="grupo-a"');
    expect(markup).toContain('id="grupo-l"');
    expect(markup).toContain('aria-current="true"');
  });

  it("does not render the group navigator on the knockout tab", async () => {
    const markup = renderToStaticMarkup(
      await PredictionsPage({
        searchParams: Promise.resolve({
          match: "bracket-match-1",
          tab: "knockout",
        }),
      }),
    );

    expect(markup).not.toContain('data-testid="group-navigator"');
    expect(markup).toContain('id="match-bracket-match-1"');
  });
});
