import { ArrowUpRight, Crown, Medal } from "lucide-react";

import type { RankingStamp } from "@/lib/types/worldcup";
import { cn } from "@/lib/utils";

import { RankingAvatar } from "./RankingAvatar";

interface RankingCardProps {
  accentLabel: string;
  avatarLabel: string;
  avatarUrl: string | null;
  breakdown: {
    champion: number;
    groupStage: number;
    knockout: number;
  };
  gapCopy: string;
  highlighted?: boolean;
  points: number;
  position: number;
  stamps: RankingStamp[];
  tourId?: string;
  title: string;
}

const stampToneStyles: Record<RankingStamp["tone"], string> = {
  exact:
    "border-status-success/30 bg-status-success/10 text-status-success",
  miss: "border-status-live/30 bg-status-live/10 text-status-live",
  points:
    "border-accent-primary/30 bg-accent-primary/10 text-accent-primary",
};

function initialsFromLabel(label: string) {
  return label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function RankingCard({
  accentLabel,
  avatarLabel,
  avatarUrl,
  breakdown,
  gapCopy,
  highlighted = false,
  points,
  position,
  stamps,
  tourId,
  title,
}: RankingCardProps) {
  return (
    <section
      className={cn(
        "rounded-cardLg border bg-surface-card/90 p-5 shadow-card",
        highlighted
          ? "border-accent-primary/35 bg-linear-to-b from-surface-elevated to-surface-card shadow-glowCyan"
          : "border-border-subtle",
      )}
      data-tour={tourId}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-primary">
            {accentLabel}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-text-primary">
            {title}
          </h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-pill border border-accent-primary/30 bg-accent-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-primary">
          <RankingAvatar
            avatarUrl={avatarUrl}
            className="size-7 border-accent-primary/30 bg-accent-primary/10 text-[10px] text-accent-primary"
            fallback={initialsFromLabel(avatarLabel)}
            name={avatarLabel}
          />
          <Crown className="size-3.5 text-accent-primary" strokeWidth={2} />
          Tú
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
            Posición
          </p>
          <p className="mt-1 font-numeric text-4xl font-bold text-text-primary">
            #{position}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
            Puntos
          </p>
          <p className="mt-1 font-numeric text-3xl font-bold text-text-primary">
            {points}
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3 rounded-card border border-border-subtle bg-background-secondary/70 px-4 py-3">
        <p className="text-sm text-text-secondary">{gapCopy}</p>
        <div className="inline-flex items-center gap-2 text-sm font-semibold text-status-success">
          <ArrowUpRight className="size-4" strokeWidth={2} />
          <Medal className="size-4" strokeWidth={2} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="min-w-0 rounded-card border border-border-subtle bg-background-secondary/70 px-2 py-3">
          <p className="break-words text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            Grupos
          </p>
          <p className="mt-1 font-numeric text-xl font-bold text-text-primary">
            {breakdown.groupStage}
          </p>
        </div>
        <div className="min-w-0 rounded-card border border-border-subtle bg-background-secondary/70 px-2 py-3">
          <p className="break-words text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            Eliminatorias
          </p>
          <p className="mt-1 font-numeric text-xl font-bold text-text-primary">
            {breakdown.knockout}
          </p>
        </div>
        <div className="min-w-0 rounded-card border border-border-subtle bg-background-secondary/70 px-2 py-3">
          <p className="break-words text-[10px] font-semibold uppercase tracking-[0.08em] text-text-muted">
            Campeón
          </p>
          <p className="mt-1 font-numeric text-xl font-bold text-text-primary">
            {breakdown.champion}
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {stamps.length > 0 ? (
          stamps.map((stamp, index) => (
            <span
              key={`${stamp.label}-${index}`}
              className={cn(
                "inline-flex items-center rounded-pill border px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]",
                stampToneStyles[stamp.tone],
              )}
            >
              {stamp.label}
            </span>
          ))
        ) : (
          <span className="inline-flex items-center rounded-pill border border-border-subtle bg-background-secondary/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
            Tu primer sello de puntos llegará con el próximo recálculo.
          </span>
        )}
      </div>
    </section>
  );
}
