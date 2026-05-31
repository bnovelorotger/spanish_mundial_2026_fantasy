import { Trophy } from "lucide-react";
import { redirect } from "next/navigation";

import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { StateCard } from "@/components/ui/StateCard";
import { RankingCard } from "@/components/worldcup/RankingCard";
import { RankingTable } from "@/components/worldcup/RankingTable";
import { ONBOARDING_TOURS } from "@/lib/onboarding/tours";
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
    redirect("/login?error=Inicia%20sesión%20para%20ver%20la%20clasificación.");
  }

  let rankingModel = null;
  let breakdown = null;

  try {
    [rankingModel, breakdown] = await Promise.all([
      getRankingByPhase(supabase),
      getUserPointsBreakdown(supabase, user.id),
    ]);
  } catch {
    rankingModel = null;
    breakdown = null;
  }

  if (!rankingModel || !breakdown) {
    return (
      <StateCard
        description="Inténtalo en un momento. El podio vuelve bajo los focos enseguida."
        eyebrow="Clasificación offline"
        title="No hemos podido cargar la clasificación."
        tone="error"
      />
    );
  }

  const rankingEntries = rankingModel.entries;
  const userEntry = rankingEntries.find((entry) => entry.userId === user.id) ?? null;
  const gapCopy = getUserGapCopy(rankingEntries, user.id);
  const stamps = getRankingStamps(breakdown);
  const topRanking = rankingEntries.slice(0, 10);

  return (
    <OnboardingTour steps={ONBOARDING_TOURS.ranking} tourId="ranking">
      <section className="space-y-6">
        <div className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-podium-gold">
                Clasificación
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-text-primary">
                Cada punto ya golpea el tablero del trofeo.
              </h1>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                La puntuación de la fase de grupos ya está en juego, el podio top
                3 se ha encendido y tu propia fila sigue fijada en la carrera.
              </p>
            </div>
            <Trophy className="size-6 text-podium-gold" strokeWidth={2} />
          </div>
        </div>

        {userEntry ? (
          <RankingCard
            accentLabel="Mi posición"
            avatarLabel={userEntry.displayName?.trim() || userEntry.username}
            avatarUrl={userEntry.avatarUrl}
            breakdown={{
              champion: breakdown.champion,
              groupStage: breakdown.groupStage,
              knockout: breakdown.knockout,
            }}
            gapCopy={gapCopy}
            highlighted
            isLive={rankingModel.isLive}
            points={userEntry.totalPoints}
            position={userEntry.position}
            stamps={stamps}
            title="Tu pulso en el torneo"
            tourId="ranking-breakdown"
          />
        ) : (
          <StateCard
            description="Cierra tus pronósticos y, al primer recálculo, aparecerás en la carrera."
            eyebrow="Sin puntos en el marcador"
            title="Tu fila se enciende con tu primer punto."
            tone="default"
          />
        )}

        <RankingTable
          currentUserId={user.id}
          entries={topRanking}
          isLive={rankingModel.isLive}
        />
      </section>
    </OnboardingTour>
  );
}
