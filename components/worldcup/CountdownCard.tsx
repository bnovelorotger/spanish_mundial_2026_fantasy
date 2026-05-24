import { Clock3, Flame } from "lucide-react";

import { cn } from "@/lib/utils";

import { PhaseBadge } from "./PhaseBadge";

export type CountdownUrgency = "critical" | "normal" | "warning";

interface CountdownCardProps {
  label: string;
  phaseLabel: string;
  timeDisplay: string;
  urgency: CountdownUrgency;
}

const urgencyStyles: Record<CountdownUrgency, string> = {
  critical:
    "border-[rgba(255,59,59,0.35)] bg-linear-to-b from-surface-elevated to-surface-card shadow-glowRed",
  normal:
    "border-[rgba(0,212,255,0.24)] bg-linear-to-b from-surface-elevated to-surface-card shadow-glowCyan",
  warning:
    "border-[rgba(255,176,32,0.28)] bg-linear-to-b from-surface-elevated to-surface-card shadow-[0_0_28px_rgba(255,176,32,0.16)]",
};

const urgencyCopy: Record<CountdownUrgency, string> = {
  critical: "Less than two hours remain before picks lock.",
  normal: "Plenty of time, but the ranking always rewards early moves.",
  warning: "The deadline is getting close. Review your picks before it locks.",
};

export function CountdownCard({
  label,
  phaseLabel,
  timeDisplay,
  urgency,
}: CountdownCardProps) {
  return (
    <section
      className={cn(
        "rounded-cardLg border p-5 shadow-card",
        urgencyStyles[urgency],
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-[0.18em] text-text-secondary">
            <Clock3 className="size-4 text-accent-primary" strokeWidth={2} />
            {label}
          </div>
          <p className="mt-4 font-numeric text-4xl font-bold tracking-tight text-text-primary sm:text-5xl">
            {timeDisplay}
          </p>
          <p className="mt-3 max-w-md text-sm leading-6 text-text-secondary">
            {urgencyCopy[urgency]}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <PhaseBadge
            label={phaseLabel}
            variant={urgency === "critical" ? "locked" : "editable"}
          />
          <div className="inline-flex items-center gap-2 rounded-pill border border-border-subtle bg-background-secondary/70 px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">
            <Flame
              className={cn(
                "size-4",
                urgency === "critical"
                  ? "text-status-live"
                  : urgency === "warning"
                    ? "text-status-warning"
                    : "text-accent-secondary",
              )}
              strokeWidth={2}
            />
            Deadline watch
          </div>
        </div>
      </div>
    </section>
  );
}
