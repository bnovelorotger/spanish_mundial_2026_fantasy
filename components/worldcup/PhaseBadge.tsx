import { cn } from "@/lib/utils";

type PhaseBadgeVariant =
  | "editable"
  | "finished"
  | "live"
  | "locked"
  | "scheduled";

interface PhaseBadgeProps {
  label: string;
  variant: PhaseBadgeVariant;
}

const badgeStyles: Record<PhaseBadgeVariant, string> = {
  editable: "border-[rgba(139,92,246,0.35)] bg-[rgba(139,92,246,0.16)] text-[#A78BFA]",
  finished:
    "border-[rgba(46,229,157,0.35)] bg-[rgba(46,229,157,0.16)] text-status-success",
  live: "animate-pulse border-[rgba(255,59,59,0.35)] bg-[rgba(255,59,59,0.16)] text-status-live",
  locked:
    "border-[rgba(255,176,32,0.35)] bg-[rgba(255,176,32,0.16)] text-status-warning",
  scheduled:
    "border-[rgba(0,212,255,0.24)] bg-[rgba(0,212,255,0.14)] text-accent-primary",
};

export function PhaseBadge({ label, variant }: PhaseBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border px-3 py-1 text-xs font-semibold tracking-[0.16em]",
        badgeStyles[variant],
      )}
    >
      {label}
    </span>
  );
}
