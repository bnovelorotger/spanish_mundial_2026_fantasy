import {
  ArrowUpRight,
  Crown,
  Medal,
  Sparkles,
  Trophy,
} from "lucide-react";

import { StateCard } from "@/components/ui/StateCard";
import type { RankingEntry } from "@/lib/types/worldcup";
import { cn } from "@/lib/utils";

import { RankingAvatar } from "./RankingAvatar";

interface RankingTableProps {
  currentUserId: string;
  entries: RankingEntry[];
}

function entryName(entry: RankingEntry) {
  return entry.displayName?.trim() || entry.username;
}

function initialsFromEntry(entry: RankingEntry) {
  return entryName(entry)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function podiumGapCopy(entry: RankingEntry, leaderPoints: number) {
  if (entry.position === 1) {
    return "Marca el ritmo bajo los focos.";
  }

  return `A ${leaderPoints - entry.totalPoints} pts del líder.`;
}

function podiumPositionLabel(position: number) {
  switch (position) {
    case 1:
      return "Primer lugar";
    case 2:
      return "Segundo lugar";
    case 3:
      return "Tercer lugar";
    default:
      return `Posición ${position}`;
  }
}

function rankingEntryAriaLabel(entry: RankingEntry, isCurrentUser: boolean) {
  const parts = [
    `Posición ${entry.position}.`,
    entryName(entry),
    `${entry.totalPoints} puntos.`,
    `A ${entry.gapToLeader} puntos del líder.`,
  ];

  if (isCurrentUser) {
    parts.splice(1, 0, "Tú.");
  }

  return parts.join(" ");
}

const podiumToneStyles: Record<number, string> = {
  1: "border-podium-gold/50 bg-podium-gold/10",
  2: "border-podium-silver/50 bg-podium-silver/10",
  3: "border-podium-bronze/50 bg-podium-bronze/10",
};

export function RankingTable({
  currentUserId,
  entries,
}: RankingTableProps) {
  const leaderPoints = entries[0]?.totalPoints ?? 0;
  const podiumEntries = entries.slice(0, 3);
  const currentUserEntry = entries.find((entry) => entry.userId === currentUserId) ?? null;
  const currentUserIsOutsidePodium =
    currentUserEntry !== null && currentUserEntry.position > 3;

  return (
    <section className="space-y-5">
      <div className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-podium-gold">
              Clasificación de la liga
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-text-primary">
              El tablero del trofeo ya está en juego.
            </h2>
          </div>
          <Trophy className="size-5 text-podium-gold" strokeWidth={2} />
        </div>

        {podiumEntries.length > 0 ? (
          <div
            aria-label="Podio actual de la liga"
            className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_repeat(2,1fr)]"
            data-tour="podium"
          >
            {podiumEntries.map((entry) => {
              const isCurrentUser = entry.userId === currentUserId;

              return (
                <article
                  aria-label={`${podiumPositionLabel(entry.position)}. ${rankingEntryAriaLabel(entry, isCurrentUser)}`}
                  key={entry.userId}
                  className={cn(
                    "rounded-cardLg border p-4 shadow-card",
                    podiumToneStyles[entry.position] ?? "border-border-subtle bg-background-secondary/70",
                    isCurrentUser &&
                      "border-accent-primary/45 bg-linear-to-b from-surface-elevated to-surface-card shadow-glowCyan",
                  )}
                  data-tour={isCurrentUser ? "your-row" : undefined}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="inline-flex size-11 items-center justify-center rounded-full border border-border-subtle bg-surface-card font-numeric text-lg font-bold text-text-primary">
                      #{entry.position}
                    </div>
                    {isCurrentUser ? (
                      <div className="inline-flex items-center gap-2 rounded-pill border border-accent-primary/30 bg-accent-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-primary">
                        <Crown className="size-3.5 text-accent-primary" strokeWidth={2} />
                        Tú
                      </div>
                    ) : (
                      <Medal className="size-5 text-text-primary" strokeWidth={2} />
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <RankingAvatar
                      avatarUrl={entry.avatarUrl}
                      className="size-11 shrink-0"
                      fallback={initialsFromEntry(entry)}
                      name={entryName(entry)}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-lg font-semibold text-text-primary">
                        {entryName(entry)}
                      </p>
                      <p className="mt-1 text-sm text-text-secondary">
                        {podiumGapCopy(entry, leaderPoints)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                        Puntos totales
                      </p>
                      <p className="mt-1 font-numeric text-3xl font-bold text-text-primary">
                        {entry.totalPoints}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                      <ArrowUpRight className="size-4 text-status-success" strokeWidth={2} />
                      A {entry.gapToLeader} pts
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5">
            <StateCard
              description="El 11 de junio el balón rueda y la liga cobra vida."
              eyebrow="Aún no hay carrera"
              title="El podio espera al primer pronóstico puntuado."
              tone="default"
            />
          </div>
        )}
      </div>

      {currentUserIsOutsidePodium && currentUserEntry ? (
        <div
          className="rounded-cardLg border border-accent-primary/35 bg-linear-to-b from-surface-elevated to-surface-card p-4 shadow-glowCyan"
          data-tour="your-row"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-primary">
                Tu fila fijada
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Tu línea en la liga sigue visible incluso cuando la tabla se aprieta.
              </p>
            </div>
            <Sparkles className="size-5 text-accent-primary" strokeWidth={2} />
          </div>

          <div className="mt-4 rounded-card border border-accent-primary/30 bg-background-secondary/70 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <RankingAvatar
                  avatarUrl={currentUserEntry.avatarUrl}
                  className="size-11 shrink-0 border-accent-primary/30 bg-accent-primary/10 text-accent-primary"
                  fallback={initialsFromEntry(currentUserEntry)}
                  name={entryName(currentUserEntry)}
                />
                <div className="min-w-0">
                  <p className="font-semibold text-text-primary">
                    #{currentUserEntry.position} {entryName(currentUserEntry)}
                  </p>
                  <div className="mt-1 inline-flex items-center gap-2 rounded-pill border border-accent-primary/25 bg-accent-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary">
                    <Crown className="size-3.5 text-accent-primary" strokeWidth={2} />
                    Tú
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-numeric text-2xl font-bold text-text-primary">
                  {currentUserEntry.totalPoints}
                </p>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
                  A {currentUserEntry.gapToLeader} pts
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-secondary">
              Tabla completa
            </p>
            <h3 className="mt-2 text-lg font-semibold text-text-primary">
              Top 10 con tu fila destacada.
            </h3>
          </div>
          <Medal className="size-5 text-accent-secondary" strokeWidth={2} />
        </div>

        {entries.length > 0 ? (
          <ol
            aria-label="Clasificación completa de la liga"
            className="mt-5 space-y-3"
          >
            {entries.map((entry) => {
              const isCurrentUser = entry.userId === currentUserId;

              return (
                <li
                  aria-label={rankingEntryAriaLabel(entry, isCurrentUser)}
                  key={`table-${entry.userId}`}
                  className={cn(
                    "list-none flex items-center justify-between gap-4 rounded-card border px-4 py-3",
                    isCurrentUser
                      ? "border-accent-primary/35 bg-surface-active shadow-glowCyan"
                      : "border-border-subtle bg-background-secondary/70",
                  )}
                  data-tour={isCurrentUser && !currentUserIsOutsidePodium ? "your-row" : undefined}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-card font-numeric text-base font-bold text-text-primary">
                      #{entry.position}
                    </div>
                    <RankingAvatar
                      avatarUrl={entry.avatarUrl}
                      className="size-11 shrink-0"
                      fallback={initialsFromEntry(entry)}
                      name={entryName(entry)}
                    />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-text-primary">
                        {entryName(entry)}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-text-muted">
                        {isCurrentUser ? (
                          <span className="inline-flex items-center gap-1 rounded-pill border border-accent-primary/25 bg-accent-primary/10 px-2 py-0.5 text-text-primary">
                            <Crown className="size-3 text-accent-primary" strokeWidth={2} />
                            Tú
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1">
                          <ArrowUpRight className="size-3 text-status-success" strokeWidth={2} />
                          A {entry.gapToLeader} pts
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-numeric text-2xl font-bold text-text-primary">
                      {entry.totalPoints}
                    </p>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
                      {entry.groupPoints} grupos
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="mt-5">
            <StateCard
              description="Cuando se puntúen los primeros pronósticos, esta tabla pasa a ser la carrera diaria."
              eyebrow="Sin marcador todavía"
              title="La tabla completa se abre con el primer recálculo."
              tone="default"
            />
          </div>
        )}
      </div>
    </section>
  );
}
