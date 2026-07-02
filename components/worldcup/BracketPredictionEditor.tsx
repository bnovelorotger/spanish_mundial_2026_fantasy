"use client";

import { Crown, LoaderCircle, Shuffle } from "lucide-react";
import { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";

import type { BracketMatchViewModel, WinnerSide } from "@/lib/types/worldcup";
import { cn } from "@/lib/utils";

import { getPersistedPickNotice } from "./knockoutPersistedPick";
import { LocalKickoff } from "./LocalKickoff";
import { PhaseBadge } from "./PhaseBadge";
import { TeamBadge } from "./TeamBadge";

interface BracketPredictionEditorProps {
  dataTourCard?: string;
  dataTourState?: string;
  flash?: {
    message: string;
    tone: "error" | "success";
  } | null;
  match: BracketMatchViewModel;
  saveAction: (formData: FormData) => void | Promise<void>;
}

interface BracketEditorFormBodyProps {
  dataTourState?: string;
  flash?: {
    message: string;
    tone: "error" | "success";
  } | null;
  match: BracketMatchViewModel;
}

function matchStateLabel(match: BracketMatchViewModel) {
  if (match.windowState === "UPCOMING") {
    return {
      label: match.windowLabel,
      variant: "scheduled" as const,
    };
  }

  if (match.lock.isLocked) {
    return {
      label: "Cerrado",
      variant: "locked" as const,
    };
  }

  if (match.prediction) {
    return {
      label: "Guardado",
      variant: "saved" as const,
    };
  }

  return {
    label: "Editable",
    variant: "editable" as const,
  };
}

function phaseLabel(match: BracketMatchViewModel) {
  switch (match.phase) {
    case "FINAL":
      return "Final";
    case "QUARTER_FINALS":
      return "Cuartos de final";
    case "ROUND_OF_16":
      return "Octavos de final";
    case "ROUND_OF_32":
      return "Dieciseisavos de final";
    case "SEMI_FINALS":
      return "Semifinales";
  }
}

function slotButtonClassName(input: {
  canPredict: boolean;
  isPendingSelection: boolean;
  isSelected: boolean;
}) {
  if (input.isPendingSelection) {
    return "border-accent-secondary/40 bg-accent-secondary/12 text-text-primary shadow-glowViolet";
  }

  if (input.isSelected) {
    return "border-accent-primary/40 bg-accent-primary/10 text-text-primary shadow-glowCyan";
  }

  if (!input.canPredict) {
    return "border-border-subtle bg-background-secondary/70 text-text-secondary";
  }

  return "border-border-subtle bg-background-secondary/70 text-text-secondary transition duration-200 hover:border-accent-secondary/35 hover:bg-surface-active hover:text-text-primary active:scale-[0.99]";
}

function BracketEditorFormBody({
  dataTourState,
  flash,
  match,
}: BracketEditorFormBodyProps) {
  const { pending } = useFormStatus();
  const [pressedWinnerSlot, setPressedWinnerSlot] = useState<WinnerSide | null>(null);

  useEffect(() => {
    if (pending || pressedWinnerSlot === null) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPressedWinnerSlot(null);
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [pending, pressedWinnerSlot]);

  const displayedWinnerSlot = pending
    ? pressedWinnerSlot
    : (match.prediction?.currentWinnerSlot ?? null);
  const stateBadge = pending
    ? {
        label: "Guardando",
        variant: "pending" as const,
      }
    : matchStateLabel(match);
  const persistedPickNotice = pending ? null : getPersistedPickNotice(match);

  return (
    <>
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

        <div
          className="flex flex-wrap items-center justify-end gap-2"
          data-tour={dataTourState}
        >
          {match.prediction?.isRandom ? (
            <span className="inline-flex items-center gap-1 rounded-pill border border-status-warning/30 bg-status-warning/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-status-warning">
              <Shuffle className="size-3.5" strokeWidth={2} />
              Aleatorio
            </span>
          ) : null}
          <PhaseBadge label={stateBadge.label} variant={stateBadge.variant} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
        <span>{match.isFinal ? "Tarjeta premium de la final" : phaseLabel(match)}</span>
        <span>· {match.windowLabel}</span>
        {match.city ? <span>· {match.city}</span> : null}
        {match.venue ? <span>· {match.venue}</span> : null}
      </div>

      <div className="mt-4 space-y-3">
        {[
          { slot: match.homeSlot, winnerSlot: "HOME" as const },
          { slot: match.awaySlot, winnerSlot: "AWAY" as const },
        ].map(({ slot, winnerSlot }) => {
          const isSelected = displayedWinnerSlot === winnerSlot;
          const isPendingSelection = pending && pressedWinnerSlot === winnerSlot;

          return (
            <button
              key={`${match.id}-${winnerSlot}-${slot.name}`}
              aria-pressed={isSelected}
              className={cn(
                "focus-ring flex w-full items-center justify-between gap-3 rounded-card border px-3 py-3 text-left transition-transform duration-150",
                pending ? "cursor-wait" : null,
                slotButtonClassName({
                  canPredict: match.canPredict,
                  isPendingSelection,
                  isSelected,
                }),
              )}
              disabled={!match.canPredict || pending}
              name="predicted_winner_slot"
              onClick={() => {
                if (!match.canPredict || pending) {
                  return;
                }

                setPressedWinnerSlot(winnerSlot);
              }}
              type="submit"
              value={winnerSlot}
            >
              <TeamBadge
                code={slot.code ?? undefined}
                flagUrl={slot.flagUrl}
                highlighted={isSelected}
                isPlaceholder={!slot.isKnown}
                name={slot.name}
              />

              {isPendingSelection ? (
                <div className="inline-flex items-center gap-2 rounded-pill border border-accent-secondary/30 bg-accent-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-primary">
                  <LoaderCircle
                    className="size-3.5 animate-spin text-accent-secondary"
                    strokeWidth={2}
                  />
                  Guardando
                </div>
              ) : isSelected ? (
                <div className="inline-flex items-center gap-2 rounded-pill border border-accent-primary/30 bg-accent-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-primary">
                  <Crown className="size-3.5 text-accent-primary" strokeWidth={2} />
                  Avanza
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      {pending ? (
        <div
          aria-live="polite"
          className="mt-3 inline-flex items-center gap-2 text-sm text-text-secondary"
          role="status"
        >
          <LoaderCircle
            className="size-4 shrink-0 animate-spin text-accent-secondary"
            strokeWidth={2}
          />
          <p>Guardando tu lado en el cuadro.</p>
        </div>
      ) : flash ? (
        <div className="mt-3 text-sm">
          <p
            className={cn(
              "font-medium",
              flash.tone === "error" ? "text-status-live" : "text-status-success",
            )}
          >
            {flash.message}
          </p>
        </div>
      ) : persistedPickNotice ? (
        <div
          className={cn(
            "mt-3 rounded-card border px-4 py-3 text-sm",
            persistedPickNotice.tone === "warning"
              ? "border-status-warning/30 bg-status-warning/10 text-text-primary"
              : "border-accent-primary/20 bg-background-secondary/70 text-text-secondary",
          )}
        >
          <p className="font-medium">{persistedPickNotice.title}</p>
          <p className="mt-1 text-text-secondary">{persistedPickNotice.description}</p>
        </div>
      ) : null}
    </>
  );
}

export function BracketPredictionEditor({
  dataTourCard,
  dataTourState,
  flash,
  match,
  saveAction,
}: BracketPredictionEditorProps) {
  return (
    <section className="scroll-mt-36 sm:scroll-mt-40" id={`match-${match.id}`}>
      <form
        action={saveAction}
        className={cn(
          "rounded-cardLg border p-4 shadow-card",
          match.isFinal
            ? "border-accent-primary/30 bg-linear-to-b from-surface-elevated to-surface-card shadow-glowCyan"
            : "border-border-subtle bg-surface-card/90",
        )}
        data-tour={dataTourCard}
      >
        <input name="match_id" type="hidden" value={match.id} />
        <input name="phase" type="hidden" value={match.phase} />
        <BracketEditorFormBody
          dataTourState={dataTourState}
          flash={flash}
          match={match}
        />
      </form>
    </section>
  );
}
