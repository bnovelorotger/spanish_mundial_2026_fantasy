import { Crown, Lock, Shuffle, Sparkles } from "lucide-react";

import type { BracketMatchViewModel } from "@/lib/types/worldcup";
import { cn } from "@/lib/utils";

import { LocalKickoff } from "./LocalKickoff";
import { PhaseBadge } from "./PhaseBadge";
import { TeamBadge } from "./TeamBadge";

interface BracketPredictionEditorProps {
  flash?: {
    message: string;
    tone: "error" | "success";
  } | null;
  match: BracketMatchViewModel;
  saveAction: (formData: FormData) => void | Promise<void>;
}

function matchStateLabel(match: BracketMatchViewModel) {
  if (match.lock.isLocked) {
    return {
      label: "Locked",
      variant: "locked" as const,
    };
  }

  if (match.prediction) {
    return {
      label: "Saved",
      variant: "saved" as const,
    };
  }

  return {
    label: "Editable",
    variant: "editable" as const,
  };
}

function slotButtonClassName(input: {
  canPredict: boolean;
  isSelected: boolean;
}) {
  if (input.isSelected) {
    return "border-accent-primary/40 bg-accent-primary/10 text-text-primary shadow-glowCyan";
  }

  if (!input.canPredict) {
    return "border-border-subtle bg-background-secondary/70 text-text-secondary";
  }

  return "border-border-subtle bg-background-secondary/70 text-text-secondary transition duration-200 hover:border-accent-secondary/35 hover:bg-surface-active hover:text-text-primary active:scale-[0.99]";
}

export function BracketPredictionEditor({
  flash,
  match,
  saveAction,
}: BracketPredictionEditorProps) {
  const stateBadge = matchStateLabel(match);

  return (
    <form
      action={saveAction}
      className={cn(
        "rounded-cardLg border p-4 shadow-card",
        match.isFinal
          ? "border-accent-primary/30 bg-linear-to-b from-surface-elevated to-surface-card shadow-glowCyan"
          : "border-border-subtle bg-surface-card/90",
      )}
    >
      <input name="match_id" type="hidden" value={match.id} />
      <input name="phase" type="hidden" value={match.phase} />

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
            Match #{match.matchNumber}
          </p>
          <h3 className="mt-1 text-base font-semibold text-text-primary">
            {match.isFinal ? (
              "Final under the lights"
            ) : (
              <LocalKickoff isoUtc={match.kickoff}>
                {({ date, time }) => (
                  <>
                    <span suppressHydrationWarning>{date}</span>{" · "}
                    <span suppressHydrationWarning>{time}</span>
                  </>
                )}
              </LocalKickoff>
            )}
          </h3>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {match.prediction?.isRandom ? (
            <span className="inline-flex items-center gap-1 rounded-pill border border-status-warning/30 bg-status-warning/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-status-warning">
              <Shuffle className="size-3.5" strokeWidth={2} />
              Random
            </span>
          ) : null}
          <PhaseBadge label={stateBadge.label} variant={stateBadge.variant} />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
        <span>{match.isFinal ? "Final premium card" : match.phase.replaceAll("_", " ")}</span>
        {match.city ? <span>- {match.city}</span> : null}
        {match.venue ? <span>- {match.venue}</span> : null}
      </div>

      <div className="mt-4 space-y-3">
        {[match.homeSlot, match.awaySlot].map((slot) => {
          const isSelected = match.prediction?.predictedWinnerTeamId === slot.id;

          return (
            <button
              key={`${match.id}-${slot.name}`}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-card border px-3 py-3 text-left",
                slotButtonClassName({
                  canPredict: match.canPredict,
                  isSelected,
                }),
              )}
              disabled={!match.canPredict || !slot.id}
              name="predicted_winner_team_id"
              type="submit"
              value={slot.id ?? ""}
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
                  <Crown className="size-3.5 text-accent-primary" strokeWidth={2} />
                  Winner
                </div>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-4 rounded-card border border-border-subtle bg-background-secondary/65 px-4 py-3 text-sm">
        {flash ? (
          <p
            className={cn(
              "font-medium",
              flash.tone === "error" ? "text-status-live" : "text-status-success",
            )}
          >
            {flash.message}
          </p>
        ) : match.lock.isLocked ? (
          <div className="flex items-start gap-2 text-text-secondary">
            <Lock className="mt-0.5 size-4 shrink-0 text-status-warning" strokeWidth={2} />
            <p>That round is locked. Your saved winner stays on the bracket board.</p>
          </div>
        ) : match.canPredict ? (
          <div className="flex items-start gap-2 text-text-secondary">
            <Sparkles
              className="mt-0.5 size-4 shrink-0 text-accent-secondary"
              strokeWidth={2}
            />
            <p>Select the winner directly on the card. Propagation stays manual for this MVP bracket.</p>
          </div>
        ) : (
          <p className="text-text-secondary">
            Pick a winner once both bracket slots are filled with known teams.
          </p>
        )}
      </div>
    </form>
  );
}
