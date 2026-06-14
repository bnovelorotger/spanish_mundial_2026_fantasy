import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { mockCreateAdminClient, mockRecalculateAllPoints, mockSyncWorldCupData } =
  vi.hoisted(() => ({
    mockCreateAdminClient: vi.fn(),
    mockRecalculateAllPoints: vi.fn(),
    mockSyncWorldCupData: vi.fn(),
  }));

vi.mock("server-only", () => ({}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: mockCreateAdminClient,
}));

vi.mock("@/lib/services/sync.service", () => ({
  syncWorldCupData: mockSyncWorldCupData,
}));

vi.mock("@/lib/services/scoring.service", () => ({
  recalculateAllPoints: mockRecalculateAllPoints,
}));

describe("POST /api/sync", () => {
  const originalCronSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = "test-cron-secret";
    mockCreateAdminClient.mockReturnValue({ admin: true });
    mockSyncWorldCupData.mockResolvedValue({
      matchesChanged: false,
      matchesSynced: 104,
      pointsRecalculated: true,
      providerFailures: [],
      providerRequested: "footballdata",
      providerUsed: "footballdata",
      recalculateSummary: {
        awardedTotal: 144,
        rowsScored: 160,
      },
      standingsChanged: true,
      standingsSynced: 48,
      status: "SUCCESS",
      teamsSynced: 48,
    });
  });

  afterEach(() => {
    process.env.CRON_SECRET = originalCronSecret;
  });

  it("rejects unauthorized calls", async () => {
    const { POST } = await import("@/app/api/sync/route");
    const response = await POST(new Request("https://example.com/api/sync"));

    expect(response.status).toBe(401);
    expect(mockSyncWorldCupData).not.toHaveBeenCalled();
  });

  it("returns the sync recalculation summary without recalculating twice", async () => {
    const { POST } = await import("@/app/api/sync/route");
    const response = await POST(
      new Request("https://example.com/api/sync", {
        headers: {
          authorization: "Bearer test-cron-secret",
        },
        method: "POST",
      }),
    );
    const body = await response.json() as {
      ok: boolean;
      recalculate: { awardedTotal: number; rowsScored: number };
    };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.recalculate).toEqual({
      awardedTotal: 144,
      rowsScored: 160,
    });
    expect(mockSyncWorldCupData).toHaveBeenCalledTimes(1);
    expect(mockRecalculateAllPoints).not.toHaveBeenCalled();
  });
});
