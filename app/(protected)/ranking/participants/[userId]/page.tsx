import Link from "next/link";
import { ArrowLeft, Crown, Trophy, UserRound } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { StateCard } from "@/components/ui/StateCard";
import { RankingAvatar } from "@/components/worldcup/RankingAvatar";
import { ReadonlyBracketView } from "@/components/worldcup/ReadonlyBracketView";
import { ReadonlyGroupPredictions } from "@/components/worldcup/ReadonlyGroupPredictions";
import { createClient } from "@/lib/supabase/server";
import {
  getParticipantBlockRevealCopy,
  getParticipantDetail,
  getParticipantResultsStamp,
} from "@/lib/services/ranking-explorer.service";

type ParticipantPageProps = {
  params: Promise<{
    userId: string;
  }>;
};

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default async function ParticipantDetailPage({
  params,
}: ParticipantPageProps) {
  const { userId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Inicia%20sesión%20para%20explorar%20la%20liga.");
  }

  let participant = null;

  try {
    participant = await getParticipantDetail(supabase, user.id, userId);
  } catch (caughtError) {
    console.error("[ranking/participants] Failed to load participant detail", caughtError);
    participant = null;
  }

  if (!participant) {
    notFound();
  }

  const summaryStamp = getParticipantResultsStamp(participant.breakdown);

  return (
    <section className="space-y-6">
      <Link
        className="focus-ring inline-flex items-center gap-2 rounded-pill border border-border-subtle bg-surface-card/90 px-4 py-2 text-sm font-semibold text-text-secondary shadow-card transition duration-200 hover:bg-surface-active hover:text-text-primary"
        href="/ranking?tab=participants"
      >
        <ArrowLeft className="size-4" strokeWidth={2} />
        Volver a participantes
      </Link>

      <div className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <RankingAvatar
              avatarUrl={participant.avatarUrl}
              className="size-16 shrink-0"
              fallback={initialsFromName(participant.displayName)}
              name={participant.displayName}
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-2xl font-semibold text-text-primary">
                  {participant.displayName}
                </p>
                {participant.isCurrentUser ? (
                  <span className="inline-flex items-center gap-1 rounded-pill border border-accent-primary/30 bg-accent-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-primary">
                    <Crown className="size-3.5 text-accent-primary" strokeWidth={2} />
                    Tú
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-sm text-text-secondary">@{participant.username}</p>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                {participant.gapCopy}
              </p>
            </div>
          </div>

          <div className="rounded-card border border-accent-primary/25 bg-accent-primary/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-primary">
              Resumen rápido
            </p>
            <p className="mt-1 font-numeric text-3xl font-bold text-text-primary">
              {participant.totalPoints}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              {participant.position ? `Posición #${participant.position}` : "Sin posición todavía"}
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-card border border-border-subtle bg-background-secondary/70 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              Grupos
            </p>
            <p className="mt-1 font-numeric text-2xl font-bold text-text-primary">
              {participant.breakdown.groupStage}
            </p>
          </div>
          <div className="rounded-card border border-border-subtle bg-background-secondary/70 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              KO
            </p>
            <p className="mt-1 font-numeric text-2xl font-bold text-text-primary">
              {participant.breakdown.knockout}
            </p>
          </div>
          <div className="rounded-card border border-border-subtle bg-background-secondary/70 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              Campeón
            </p>
            <p className="mt-1 font-numeric text-2xl font-bold text-text-primary">
              {participant.breakdown.champion}
            </p>
          </div>
          <div className="rounded-card border border-border-subtle bg-background-secondary/70 px-3 py-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
              Lectura
            </p>
            <p className="mt-1 text-sm font-semibold text-text-primary">
              {summaryStamp}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-secondary">
              Resumen
            </p>
            <h2 className="mt-2 text-xl font-semibold text-text-primary">
              Qué se puede ver ya de su torneo.
            </h2>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              {getParticipantBlockRevealCopy({
                isCurrentUser: participant.isCurrentUser,
                label: "la fase de grupos",
                lock: participant.groupLock,
              })}{" "}
              {getParticipantBlockRevealCopy({
                isCurrentUser: participant.isCurrentUser,
                label: "la ventana 1",
                lock: participant.knockoutStageOneLock,
              })}{" "}
              {getParticipantBlockRevealCopy({
                isCurrentUser: participant.isCurrentUser,
                label: "la ventana 2",
                lock: participant.knockoutStageTwoLock,
              })}
            </p>
          </div>
          <UserRound className="size-5 text-accent-primary" strokeWidth={2} />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-card border border-border-subtle bg-background-secondary/70 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
              Grupos
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              {participant.groupLock.isLocked
                ? "Ya visibles"
                : participant.isCurrentUser
                  ? "Solo lectura"
                  : "Aún ocultos"}
            </p>
          </div>
          <div className="rounded-card border border-border-subtle bg-background-secondary/70 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
              Ventana 1 KO
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              {participant.knockoutStageOneLock.isLocked
                ? "Ya visible"
                : participant.isCurrentUser
                  ? "Solo lectura"
                  : "Aún oculta"}
            </p>
          </div>
          <div className="rounded-card border border-border-subtle bg-background-secondary/70 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
              Ventana 2 KO
            </p>
            <p className="mt-2 text-sm text-text-secondary">
              {participant.knockoutStageTwoLock.isLocked
                ? "Ya visible"
                : participant.isCurrentUser
                  ? "Solo lectura"
                  : "Aún oculta"}
            </p>
          </div>
        </div>
      </div>

      <ReadonlyGroupPredictions
        groupLock={participant.groupLock}
        groups={participant.groups}
        isCurrentUser={participant.isCurrentUser}
      />

      <ReadonlyBracketView
        isCurrentUser={participant.isCurrentUser}
        rounds={participant.bracketRounds}
        stageOneLock={participant.knockoutStageOneLock}
        stageTwoLock={participant.knockoutStageTwoLock}
      />

      <StateCard
        description="Esta vista es solo de lectura y sigue las mismas reglas de revelado por lock que la competición."
        eyebrow="Sin edición"
        title="Aquí se explora el torneo; los cambios siguen viviendo en Predicciones."
        tone="default"
        action={
          <Link
            className="focus-ring inline-flex items-center gap-2 rounded-pill border border-accent-primary/30 bg-accent-primary/10 px-4 py-2 text-sm font-semibold text-text-primary transition duration-200 hover:bg-accent-primary/15"
            href="/predictions"
          >
            <Trophy className="size-4 text-accent-primary" strokeWidth={2} />
            Ir a mis predicciones
          </Link>
        }
      />
    </section>
  );
}
