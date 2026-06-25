import { Trophy, Users } from "lucide-react";
import { redirect } from "next/navigation";

import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { StateCard } from "@/components/ui/StateCard";
import { ParticipantExplorerList } from "@/components/worldcup/ParticipantExplorerList";
import { RankingCard } from "@/components/worldcup/RankingCard";
import { RankingTabNav } from "@/components/worldcup/RankingTabNav";
import { RankingTable } from "@/components/worldcup/RankingTable";
import { ResultsFeed } from "@/components/worldcup/ResultsFeed";
import { ONBOARDING_TOURS } from "@/lib/onboarding/tours";
import {
  getParticipantExplorerEntries,
  getResultsFeed,
  getResultsFeedEmptyStateCopy,
} from "@/lib/services/ranking-explorer.service";
import {
  getRankingByPhase,
  getRankingStamps,
  getUserGapCopy,
  getUserPointsBreakdown,
} from "@/lib/services/ranking.service";
import { createClient } from "@/lib/supabase/server";
import type { RankingTab } from "@/lib/types/worldcup";
import type { SupabaseClient } from "@supabase/supabase-js";

type RankingPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function resolveTab(value: string | undefined): RankingTab {
  if (value === "results" || value === "participants") {
    return value;
  }

  return "overview";
}

function Header({
  tab,
}: {
  tab: RankingTab;
}) {
  if (tab === "results") {
    return (
      <div className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-secondary">
              Resultados
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-text-primary">
              Lo que pasó en el torneo y cómo sacudió la liga.
            </h1>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              Cada tarjeta mezcla el resultado real con su reparto de aciertos,
              fallos y puntos dentro de vuestra clasificación.
            </p>
          </div>
          <Trophy className="size-6 text-podium-gold" strokeWidth={2} />
        </div>
      </div>
    );
  }

  if (tab === "participants") {
    return (
      <div className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-secondary">
              Participantes
            </p>
            <h1 className="mt-2 text-2xl font-semibold text-text-primary">
              Explora la carrera usuario a usuario.
            </h1>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              Abre el perfil de cada participante para ver sus grupos y su bracket
              ya revelable por locks, sin mezclar edición con exploración.
            </p>
          </div>
          <Users className="size-6 text-accent-primary" strokeWidth={2} />
        </div>
      </div>
    );
  }

  return (
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
            La puntuación de grupos y eliminatorias sigue moviendo el podio, y tu
            fila sigue visible en plena carrera.
          </p>
        </div>
        <Trophy className="size-6 text-podium-gold" strokeWidth={2} />
      </div>
    </div>
  );
}

async function OverviewContent({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}) {
  let rankingModel = null;
  let breakdown = null;

  try {
    [rankingModel, breakdown] = await Promise.all([
      getRankingByPhase(supabase),
      getUserPointsBreakdown(supabase, userId),
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
  const userEntry = rankingEntries.find((entry) => entry.userId === userId) ?? null;
  const gapCopy = getUserGapCopy(rankingEntries, userId);
  const stamps = getRankingStamps(breakdown);
  const topRanking = rankingEntries.slice(0, 10);

  return (
    <>
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
        currentUserId={userId}
        entries={topRanking}
        isLive={rankingModel.isLive}
      />
    </>
  );
}

export default async function RankingPage({ searchParams }: RankingPageProps) {
  const params = (await searchParams) ?? {};
  const activeTab = resolveTab(getQueryValue(params, "tab"));
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Inicia%20sesión%20para%20ver%20la%20clasificación.");
  }

  let resultsFeed = null;
  let participants = null;

  if (activeTab === "results") {
    try {
      resultsFeed = await getResultsFeed(supabase);
    } catch {
      resultsFeed = null;
    }
  }

  if (activeTab === "participants") {
    try {
      participants = await getParticipantExplorerEntries(supabase, user.id);
    } catch {
      participants = null;
    }
  }

  const emptyResultsState =
    resultsFeed !== null ? getResultsFeedEmptyStateCopy(resultsFeed) : null;

  return (
    <OnboardingTour steps={ONBOARDING_TOURS.ranking} tourId="ranking">
      <section className="space-y-6">
        <Header tab={activeTab} />
        <RankingTabNav currentTab={activeTab} />

        {activeTab === "overview" ? (
          <OverviewContent supabase={supabase} userId={user.id} />
        ) : null}

        {activeTab === "results" ? (
          resultsFeed ? (
            emptyResultsState ? (
              <StateCard
                description={emptyResultsState.description}
                eyebrow={emptyResultsState.eyebrow}
                title={emptyResultsState.title}
                tone="default"
              />
            ) : (
              <ResultsFeed items={resultsFeed} />
            )
          ) : (
            <StateCard
              description="Inténtalo en un momento. El feed de impactos volverá a encenderse enseguida."
              eyebrow="Resultados offline"
              title="No hemos podido cargar los resultados de la liga."
              tone="error"
            />
          )
        ) : null}

        {activeTab === "participants" ? (
          participants ? (
            <ParticipantExplorerList entries={participants} />
          ) : (
            <StateCard
              description="Inténtalo en un momento. La parrilla de participantes sigue cargándose desde la liga."
              eyebrow="Participantes offline"
              title="No hemos podido cargar la exploración de usuarios."
              tone="error"
            />
          )
        ) : null}
      </section>
    </OnboardingTour>
  );
}
