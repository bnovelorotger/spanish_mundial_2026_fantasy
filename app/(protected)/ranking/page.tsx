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
    redirect("/login?error=Inicia%20sesi%C3%B3n%20para%20ver%20la%20clasificaci%C3%B3n.");
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
        description="Prueba de nuevo en un momento. El podio debería volver bajo los focos enseguida."
        eyebrow="Clasificación fuera de juego"
        title="No hemos podido cargar la clasificación de la liga."
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
          title="Tu pulso en el torneo"
        />
      ) : (
        <StateCard
          description="Deja listos tus pronósticos, espera a las clasificaciones finales y tus primeros sellos de puntos aparecerán aquí."
          eyebrow="Tu torneo empieza aquí."
          title="Tu fila en la clasificación aparecerá en cuanto tu perfil entre en el tablero."
          tone="default"
        />
      )}

      <RankingTable currentUserId={user.id} entries={topRanking} />
    </section>
  );
}
