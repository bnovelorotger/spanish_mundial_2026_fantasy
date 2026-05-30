import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Lock, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";

type StateCardTone = "default" | "error" | "success" | "warning";

interface StateCardProps {
  action?: ReactNode;
  description?: string;
  eyebrow?: string;
  title?: string;
  tone?: StateCardTone;
}

const toneStyles: Record<StateCardTone, string> = {
  default: "border-border-subtle bg-surface-card/90",
  error: "border-status-live/35 bg-surface-card/90",
  success: "border-status-success/35 bg-surface-card/90",
  warning: "border-status-warning/35 bg-surface-card/90",
};

const eyebrowStyles: Record<StateCardTone, string> = {
  default: "text-accent-primary",
  error: "text-status-live",
  success: "text-status-success",
  warning: "text-status-warning",
};

const icons: Record<StateCardTone, typeof Sparkles> = {
  default: Sparkles,
  error: AlertCircle,
  success: CheckCircle2,
  warning: Lock,
};

export function StateCard({
  action,
  description = "Cuando haya algo que mostrar en esta zona, lo verás aquí.",
  eyebrow = "Sin movimiento todavía",
  title = "Esta tarjeta espera su primer dato.",
  tone = "default",
}: StateCardProps) {
  const Icon = icons[tone];

  return (
    <section
      className={cn(
        "rounded-cardLg border p-6 shadow-card",
        toneStyles[tone],
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={cn(
              "text-sm font-medium uppercase tracking-[0.18em]",
              eyebrowStyles[tone],
            )}
          >
            {eyebrow}
          </p>
          <h2 className="mt-2 text-xl font-semibold text-text-primary">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            {description}
          </p>
        </div>
        <Icon className="size-5 shrink-0 text-text-muted" strokeWidth={2} />
      </div>

      {action ? <div className="mt-5">{action}</div> : null}
    </section>
  );
}
