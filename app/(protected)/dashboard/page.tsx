import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  CalendarClock,
  ChevronRight,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { StateCard } from "@/components/ui/StateCard";
import {
  CountdownCard,
  type CountdownUrgency,
} from "@/components/worldcup/CountdownCard";
import { LocalKickoff } from "@/components/worldcup/LocalKickoff";
import { PhaseBadge } from "@/components/worldcup/PhaseBadge";
import { RankingCard } from "@/components/worldcup/RankingCard";
import { ONBOARDING_TOURS } from "@/lib/onboarding/tours";
import { getNextOpenLock } from "@/lib/services/locks.service";
import { getNextScheduledMatch } from "@/lib/services/matches.service";
import {
  getRankingByPhase,
  getRankingStamps,
  getUserGapCopy,
  getUserPointsBreakdown,
} from "@/lib/services/ranking.service";
import { createClient } from "@/lib/supabase/server";
import type {
  LockPhase,
  MatchCardViewModel,
  MatchPhase,
} from "@/lib/types/worldcup";

interface ActivityItem {
  id: string;
  text: string;
  timestamp: string;
}

interface DashboardCountdownModel {
  description: string;
  label: string;
  phaseLabel: string;
  state: "active" | "finished";
  timeDisplay: string;
  urgency?: CountdownUrgency;
}

const activityFeed = [
  {
    id: "a1",
    text: "Los primeros puntos de la fase de grupos ya están moviendo la carrera entre amigos.",
    timestamp: "Ahora",
  },
  {
    id: "a2",
    text: "Cada orden de grupo guardado os acerca un poco más al podio de la clasificación.",
    timestamp: "Hoy",
  },
] satisfies ActivityItem[];

const matchPhaseLabels: Record<MatchPhase, string> = {
  FINAL: "Final",
  GROUP_STAGE: "Fase de grupos",
  QUARTER_FINALS: "Cuartos de final",
  ROUND_OF_16: "Octavos de final",
  ROUND_OF_32: "Dieciseisavos de final",
  SEMI_FINALS: "Semifinales",
  THIRD_PLACE: "Tercer puesto",
};

const lockPhaseLabels: Record<LockPhase, string> = {
  CHAMPION: "Campeón",
  FINAL: "Final",
  GROUP_STAGE: "Fase de grupos",
  QUARTER_FINALS: "Cuartos de final",
  ROUND_OF_16: "Octavos de final",
  ROUND_OF_32: "Dieciseisavos de final",
  SEMI_FINALS: "Semifinales",
  THIRD_PLACE: "Tercer puesto",
};

function entryName(entry: {
  displayName: string | null;
  username: string;
}) {
  return entry.displayName?.trim() || entry.username;
}

function teamName(
  team: MatchCardViewModel["homeTeam"],
  placeholder: string | null,
) {
  return team?.name ?? placeholder ?? "Por decidir";
}

function formatRemainingLockTime(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (remainingMs > 24 * 60 * 60 * 1000) {
    return `${totalDays}d ${totalHours % 24}h`;
  }

  if (remainingMs > 60 * 60 * 1000) {
    return `${totalHours}h ${totalMinutes % 60}m`;
  }

  return `${totalMinutes}m ${totalSeconds % 60}s`;
}

function countdownUrgency(remainingMs: number): CountdownUrgency {
  if (remainingMs > 24 * 60 * 60 * 1000) {
    return "normal";
  }

  if (remainingMs > 2 * 60 * 60 * 1000) {
    return "warning";
  }

  return "critical";
}

async function getDashboardCountdown(
  supabase: SupabaseClient,
  now: Date,
) {
  const nextOpenLock = await getNextOpenLock(supabase, now);

  if (!nextOpenLock?.lock_at) {
    return {
      description:
        "Ahora mismo todas las ventanas de pronóstico están cerradas. La tabla volverá a moverse cuando entren nuevos resultados.",
      label: "Las predicciones cierran en",
      phaseLabel: "Finalizado",
      state: "finished",
      timeDisplay: "Todo cerrado",
    } satisfies DashboardCountdownModel;
  }

  const remainingMs =
    new Date(nextOpenLock.lock_at).getTime() - now.getTime();

  return {
    description: `Siguiente cierre: ${lockPhaseLabels[nextOpenLock.phase]}.`,
    label: "Las predicciones cierran en",
    phaseLabel: lockPhaseLabels[nextOpenLock.phase],
    state: "active",
    timeDisplay: formatRemainingLockTime(remainingMs),
    urgency: countdownUrgency(remainingMs),
  } satisfies DashboardCountdownModel;
}

export default async function DashboardPage() {
  const now = new Date();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let ranking = null;
  let breakdown = null;
  let nextMatch = null;
  let countdown: DashboardCountdownModel = {
    description:
      "Ahora mismo todas las ventanas de pronóstico están cerradas. La tabla volverá a moverse cuando entren nuevos resultados.",
    label: "Las predicciones cierran en",
    phaseLabel: "Finalizado",
    state: "finished",
    timeDisplay: "Todo cerrado",
  };

  try {
    [countdown, nextMatch] = await Promise.all([
      getDashboardCountdown(supabase, now),
      getNextScheduledMatch(supabase, now),
    ]);
  } catch {
    countdown = {
      description:
        "La próxima fecha límite se está cargando desde el tablero del torneo. Vuelve a refrescar en un momento.",
      label: "Las predicciones cierran en",
      phaseLabel: "Aviso",
      state: "finished",
      timeDisplay: "--",
    };
    nextMatch = null;
  }

  if (user) {
    try {
      [ranking, breakdown] = await Promise.all([
        getRankingByPhase(supabase),
        getUserPointsBreakdown(supabase, user.id),
      ]);
    } catch {
      ranking = null;
      breakdown = null;
    }
  }

  const userEntry =
    user && ranking ? ranking.find((entry) => entry.userId === user.id) ?? null : null;
  const gapCopy =
    user && ranking
      ? getUserGapCopy(ranking, user.id)
      : "Tu tabla de clasificación se iluminará en cuanto entren puntos en juego.";
  const stamps = breakdown ? getRankingStamps(breakdown, 3) : [];
  const topThree = ranking?.slice(0, 3) ?? [];

  return (
    <OnboardingTour steps={ONBOARDING_TOURS.home} tourId="home">
      <div className="space-y-6">
        <CountdownCard {...countdown} dataTour="countdown" />

        {userEntry && breakdown ? (
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
            points={userEntry.totalPoints}
            position={userEntry.position}
            stamps={stamps}
            title="Tu pulso en el torneo"
            tourId="ranking-pill"
          />
        ) : (
          <StateCard
            description="El podio se llena cuando la fase de grupos cierra sus locks."
            eyebrow="Sin puntos en el marcador"
            title="Tu primer punto aterriza con la primera acertada."
            tone="default"
          />
        )}

        {nextMatch ? (
          <section className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-secondary">
                  Próximo partido
                </p>
                <h2 className="mt-2 text-lg font-semibold text-text-primary">
                  {teamName(nextMatch.homeTeam, nextMatch.homePlaceholder)} vs{" "}
                  {teamName(nextMatch.awayTeam, nextMatch.awayPlaceholder)}
                </h2>
              </div>
              <PhaseBadge label="Programado" variant="scheduled" />
            </div>

            <div className="mt-5 grid gap-3 rounded-card border border-border-subtle bg-background-secondary/75 p-4">
              <div className="flex items-center gap-2 text-sm text-text-secondary">
                <CalendarClock className="size-4 text-accent-primary" strokeWidth={2} />
                <LocalKickoff isoUtc={nextMatch.kickoff} separator=" · " />
              </div>
              <p className="text-sm text-text-secondary">
                {matchPhaseLabels[nextMatch.phase]}
                {nextMatch.city ? ` · ${nextMatch.city}` : ""}
              </p>
              <p className="text-sm text-text-muted">
                El calendario en directo ya está conectado al torneo. Sede:{" "}
                {nextMatch.venue ?? "Por decidir"}.
              </p>
            </div>
          </section>
        ) : (
          <StateCard
            description="El calendario se actualizará cuando haya un choque en agenda."
            eyebrow="Sin próximo partido"
            title="Ningún cruce programado por ahora."
            tone="default"
          />
        )}

        <section className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-status-warning">
                Predicciones pendientes
              </p>
              <h2 className="mt-2 text-lg font-semibold text-text-primary">
                Los grupos ya están en juego. Deja cerrado tu orden antes del primer partido.
              </h2>
            </div>
            <Sparkles className="size-5 text-accent-primary" strokeWidth={2} />
          </div>

          <p className="mt-3 text-sm leading-6 text-text-secondary">
            El editor está abierto, las reglas de cierre ya mandan y cada grupo
            guardado alimenta directamente la carrera por la clasificación.
          </p>

          <Link
            className="mt-5 inline-flex h-12 items-center justify-center rounded-pill bg-linear-to-r from-accent-primary to-accent-secondary px-6 text-sm font-semibold text-background-main shadow-glowCyan transition-transform duration-200 hover:scale-[0.99]"
            href="/predictions"
          >
            Haz tus pronósticos
          </Link>
        </section>

        <section className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-primary">
                Top de la clasificación
              </p>
              <h2 className="mt-2 text-lg font-semibold text-text-primary">
                El tablero del trofeo ya está marcando el ritmo de la liga.
              </h2>
            </div>
            <Trophy className="size-5 text-podium-gold" strokeWidth={2} />
          </div>

          <div className="mt-5 space-y-3">
            {topThree.length > 0 ? (
              topThree.map((entry) => (
                <div
                  key={entry.userId}
                  className="flex items-center justify-between rounded-card border border-border-subtle bg-background-secondary/75 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-text-primary">
                      #{entry.position} {entryName(entry)}
                    </p>
                    <p className="text-xs text-text-muted">
                      A {entry.gapToLeader} pts · {entry.groupPoints} pts en grupos
                    </p>
                  </div>
                  <p className="font-numeric text-xl font-bold text-text-primary">
                    {entry.totalPoints}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-card border border-border-subtle bg-background-secondary/75 p-4">
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-primary">
                  Aún no hay carrera
                </p>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  La clasificación arranca con el primer pitido. El 11 de junio el balón rueda y la liga cobra vida.
                </p>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-secondary">
                Actividad reciente
              </p>
              <h2 className="mt-2 text-lg font-semibold text-text-primary">
                Tu torneo entre amigos empieza a calentarse.
              </h2>
            </div>
            <Users className="size-5 text-accent-secondary" strokeWidth={2} />
          </div>

          <div className="mt-5 space-y-3">
            {activityFeed.map((item) => (
              <article
                key={item.id}
                className="rounded-card border border-border-subtle bg-background-secondary/75 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm leading-6 text-text-secondary">{item.text}</p>
                  <ChevronRight
                    className="size-4 shrink-0 text-text-muted"
                    strokeWidth={2}
                  />
                </div>
                <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
                  {item.timestamp}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </OnboardingTour>
  );
}
