import { ArrowUpRight, Medal } from "lucide-react";

import { cn } from "@/lib/utils";

interface RankingCardProps {
  accentLabel: string;
  gapCopy: string;
  highlighted?: boolean;
  points: number;
  position: number;
  title: string;
}

export function RankingCard({
  accentLabel,
  gapCopy,
  highlighted = false,
  points,
  position,
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
        <div className="rounded-pill border border-border-subtle bg-background-secondary/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">
          You
        </div>
      </div>

      <div className="mt-6 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
            Position
          </p>
          <p className="mt-1 font-numeric text-4xl font-bold text-text-primary">
            #{position}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
            Points
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
    </section>
  );
}
