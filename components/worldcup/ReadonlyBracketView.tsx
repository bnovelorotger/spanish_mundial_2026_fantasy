import { Crown, Lock, Sparkles } from "lucide-react";

import type {
  ParticipantBracketRoundViewModel,
  PhaseLockViewModel,
} from "@/lib/types/worldcup";
import { cn } from "@/lib/utils";

import { StateCard } from "@/components/ui/StateCard";

import {
  getDisplayedWinnerSlot,
  getPersistedPickNotice,
} from "./knockoutPersistedPick";
import { LocalKickoff } from "./LocalKickoff";
import { TeamBadge } from "./TeamBadge";

function lockCopy(lock: PhaseLockViewModel, label: string, isCurrentUser: boolean) {
  if (isCurrentUser) {
    return `Tu ${label.toLowerCase()} se enseña aquí en modo lectura.`;
  }

  if (lock.isLocked) {
    return `${label} ya cerró y los picks de esta ventana ya son visibles.`;
  }

  return `Se revela al cierre de ${label.toLowerCase()}.`;
}

function resolutionBadge(match: ParticipantBracketRoundViewModel["matches"][number]) {
  switch (match.resolutionState) {
    case "CORRECT":
      return {
        label: "Acierto",
        style: "border-status-success/30 bg-status-success/10 text-status-success",
      };
    case "WRONG":
      return {
        label: "Fallo",
        style: "border-status-live/30 bg-status-live/10 text-status-live",
      };
    case "EMPTY":
      return {
        label: "Sin pick",
        style: "border-border-subtle bg-background-secondary/70 text-text-muted",
      };
    default:
      return {
        label: "Pendiente",
        style: "border-status-warning/30 bg-status-warning/10 text-status-warning",
      };
  }
}

function slotClassName(isSelected: boolean) {
  if (isSelected) {
    return "border-accent-primary/35 bg-accent-primary/10 shadow-glowCyan";
  }

  return "border-border-subtle bg-background-secondary/70";
}

export function ReadonlyBracketView({
  isCurrentUser,
  rounds,
  stageOneLock,
  stageTwoLock,
}: {
  isCurrentUser: boolean;
  rounds: ParticipantBracketRoundViewModel[];
  stageOneLock: PhaseLockViewModel;
  stageTwoLock: PhaseLockViewModel;
}) {
  return (
    <section className="space-y-4">
      <div className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-secondary">
              Eliminatorias
            </p>
            <h2 className="mt-2 text-xl font-semibold text-text-primary">
              El bracket se explora por ventanas, sin modo edición.
            </h2>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              {lockCopy(stageOneLock, "la ventana 1", isCurrentUser)}{" "}
              {lockCopy(stageTwoLock, "la ventana 2", isCurrentUser)}
            </p>
          </div>
          <Sparkles className="size-5 text-accent-primary" strokeWidth={2} />
        </div>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4">
          {rounds.map((round) => {
            const lock =
              round.phase === "ROUND_OF_32" || round.phase === "ROUND_OF_16"
                ? stageOneLock
                : stageTwoLock;
            const isHidden = round.revealState === "HIDDEN_UNTIL_LOCK";

            return (
              <section
                key={round.phase}
                className="w-[280px] shrink-0 rounded-cardLg border border-border-subtle bg-surface-card/80 p-4 shadow-card"
              >
                <div className="border-l-2 border-accent-secondary/35 pl-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-secondary">
                    {round.label}
                  </p>
                  <p className="mt-1 text-sm text-text-secondary">
                    {round.matches.length} partido{round.matches.length === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="mt-4 space-y-4">
                  {isHidden ? (
                    <StateCard
                      description={lockCopy(
                        lock,
                        round.matches[0]?.windowLabel ?? "esta ventana",
                        isCurrentUser,
                      )}
                      eyebrow="Ventana protegida"
                      title="Este tramo del cuadro aún no se revela."
                      tone="warning"
                    />
                  ) : (
                    round.matches.map((match) => {
                      const badge = resolutionBadge(match);
                      const persistedPick = getPersistedPickNotice(match);

                      return (
                        <article
                          key={match.id}
                          className={cn(
                            "rounded-cardLg border p-4 shadow-card",
                            match.isFinal
                              ? "border-accent-primary/30 bg-linear-to-b from-surface-elevated to-surface-card shadow-glowCyan"
                              : "border-border-subtle bg-surface-card/90",
                          )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                                Partido #{match.matchNumber}
                              </p>
                              <h3 className="mt-1 text-base font-semibold text-text-primary">
                                {match.isFinal ? (
                                  "La final bajo los focos"
                                ) : (
                                  <LocalKickoff isoUtc={match.kickoff} separator=" · " />
                                )}
                              </h3>
                            </div>
                            <span
                              className={`inline-flex rounded-pill border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${badge.style}`}
                            >
                              {badge.label}
                            </span>
                          </div>

                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
                            <span>{match.windowLabel}</span>
                            {match.city ? <span>· {match.city}</span> : null}
                            {match.venue ? <span>· {match.venue}</span> : null}
                          </div>

                          <div className="mt-4 space-y-3">
                            {[
                              { side: "HOME" as const, slot: match.homeSlot },
                              { side: "AWAY" as const, slot: match.awaySlot },
                            ].map(({ side, slot }) => {
                              const isSelected = getDisplayedWinnerSlot(match) === side;

                              return (
                                <div
                                  key={`${match.id}-${side}-${slot.name}`}
                                  className={cn(
                                    "flex items-center justify-between gap-3 rounded-card border px-3 py-3",
                                    slotClassName(isSelected),
                                  )}
                                >
                                  <TeamBadge
                                    code={slot.code ?? undefined}
                                    flagUrl={slot.flagUrl}
                                    highlighted={isSelected}
                                    isPlaceholder={!slot.isKnown}
                                    name={slot.name}
                                  />

                                  {isSelected ? (
                                    <div className="inline-flex items-center gap-2 rounded-pill border border-accent-primary/30 bg-accent-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-primary">
                                      <Crown
                                        className="size-3.5 text-accent-primary"
                                        strokeWidth={2}
                                      />
                                      Pick
                                    </div>
                                  ) : null}
                                </div>
                              );
                            })}
                          </div>

                          {persistedPick ? (
                            <div className="mt-3">
                              <StateCard
                                description={persistedPick.description}
                                eyebrow="Pick guardado"
                                title={persistedPick.title}
                                tone={persistedPick.tone}
                              />
                            </div>
                          ) : null}

                          <div className="mt-4 rounded-card border border-border-subtle bg-background-secondary/60 px-4 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                                  Puntos de este cruce
                                </p>
                                <p className="mt-1 font-numeric text-2xl font-bold text-text-primary">
                                  {match.awardedPoints ?? 0}
                                </p>
                              </div>
                              {match.championBonusPointsAwarded ? (
                                <div className="text-right">
                                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-primary">
                                    Bonus campeón
                                  </p>
                                  <p className="mt-1 font-numeric text-xl font-bold text-text-primary">
                                    {match.championBonusPointsAwarded}
                                  </p>
                                </div>
                              ) : null}
                            </div>

                            {!match.lock.isLocked ? (
                              <div className="mt-3 inline-flex items-center gap-2 text-sm text-text-secondary">
                                <Lock className="size-4 text-status-warning" strokeWidth={2} />
                                <p>El resultado real todavía no está cerrado.</p>
                              </div>
                            ) : null}
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
}
