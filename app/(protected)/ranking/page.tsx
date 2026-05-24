import { Trophy } from "lucide-react";
import { redirect } from "next/navigation";

import { StateCard } from "@/components/ui/StateCard";
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
      <StateCard
        description="Try again in a moment. The podium should be back under the lights shortly."
        eyebrow="Ranking board offline"
        title="Couldn't load the league ranking."
        tone="error"
      />
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
        <StateCard
          description="Lock in predictions, wait for final standings, and your first point stamps will show up here."
          eyebrow="Your tournament starts here."
          title="Your ranking row appears as soon as your profile joins the board."
          tone="default"
        />
      )}

      <RankingTable currentUserId={user.id} entries={topRanking} />
    </section>
  );
}
