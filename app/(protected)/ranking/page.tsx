import { Trophy } from "lucide-react";
import { redirect } from "next/navigation";

import { RankingCard } from "@/components/worldcup/RankingCard";
import { RankingTable } from "@/components/worldcup/RankingTable";
import {
  getRankingByPhase,
  getRankingStamps,
  getUserGapCopy,
  getUserPointsBreakdown,
} from "@/lib/services/ranking.service";
import { createClient } from "@/lib/supabase/server";

export default async function RankingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Sign%20in%20to%20view%20the%20ranking.");
  }

  let ranking = null;
  let breakdown = null;

  try {
    [ranking, breakdown] = await Promise.all([
      getRankingByPhase(supabase),
      getUserPointsBreakdown(supabase, user.id),
    ]);
  } catch {
    ranking = null;
    breakdown = null;
  }

  if (!ranking || !breakdown) {
    return (
      <section className="rounded-cardLg border border-status-live/35 bg-surface-card/90 p-6 shadow-card">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-status-live">
          Ranking board offline
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-text-primary">
          Couldn&apos;t load the league ranking.
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Try again in a moment. The podium should be back under the lights
          shortly.
        </p>
      </section>
    );
  }

  const userEntry = ranking.find((entry) => entry.userId === user.id) ?? null;
  const gapCopy = getUserGapCopy(ranking, user.id);
  const stamps = getRankingStamps(breakdown);
  const topRanking = ranking.slice(0, 10);

  return (
    <section className="space-y-6">
      <div className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-podium-gold">
              Ranking hero
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-text-primary">
              Every point now hits the trophy board.
            </h1>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              Group-stage scoring is now live, the top 3 podium is lit, and
              your own row stays pinned in the race.
            </p>
          </div>
          <Trophy className="size-6 text-podium-gold" strokeWidth={2} />
        </div>
      </div>

      {userEntry ? (
        <RankingCard
          accentLabel="My ranking position"
          breakdown={{
            champion: breakdown.champion,
            groupStage: breakdown.groupStage,
            knockout: breakdown.knockout,
          }}
          gapCopy={gapCopy}
          highlighted
          points={userEntry.totalPoints}
          position={userEntry.position}
          stamps={stamps}
          title="Your tournament pulse"
        />
      ) : (
        <div className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-6 shadow-card">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-primary">
            Your tournament starts here.
          </p>
          <h2 className="mt-2 text-xl font-semibold text-text-primary">
            Your ranking row appears as soon as your profile joins the board.
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            Lock in predictions, wait for final standings, and your first point
            stamps will show up here.
          </p>
        </div>
      )}

      <RankingTable currentUserId={user.id} entries={topRanking} />
    </section>
  );
}
