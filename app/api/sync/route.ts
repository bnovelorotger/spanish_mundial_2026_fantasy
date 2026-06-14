import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { syncWorldCupData } from "@/lib/services/sync.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorizedRequest(authorizationHeader: string | null) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    throw new Error("Missing CRON_SECRET on the server.");
  }

  return authorizationHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: Request) {
  try {
    if (!isAuthorizedRequest(request.headers.get("authorization"))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminClient = createAdminClient();
    const syncSummary = await syncWorldCupData(adminClient);

    return NextResponse.json({
      ok: true,
      recalculate: syncSummary.recalculateSummary,
      sync: syncSummary,
    });
  } catch (error) {
    const message =
      error instanceof Error &&
      error.message === "Missing CRON_SECRET on the server."
        ? error.message
        : "Sync failed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
