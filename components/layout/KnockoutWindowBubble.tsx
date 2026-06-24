"use client";

import Link from "next/link";
import { BellRing, Clock3, Target } from "lucide-react";
import { useEffect, useState } from "react";

import type { KnockoutWindowSummary } from "@/lib/types/worldcup";

function formatRemaining(lockAt: string, now: Date) {
  const remainingMs = Math.max(0, new Date(lockAt).getTime() - now.getTime());
  const totalSeconds = Math.floor(remainingMs / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);

  if (totalHours >= 24) {
    const totalDays = Math.floor(totalHours / 24);
    return `${totalDays}d ${totalHours % 24}h`;
  }

  if (totalHours >= 1) {
    return `${totalHours}h ${totalMinutes % 60}m`;
  }

  return `${totalMinutes}m ${totalSeconds % 60}s`;
}

interface KnockoutWindowBubbleProps {
  notice: KnockoutWindowSummary;
}

export function KnockoutWindowBubble({
  notice,
}: KnockoutWindowBubbleProps) {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  if (!notice.effectiveLockAt) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-4 top-4 z-40 mx-auto max-w-xl">
      <aside className="pointer-events-auto rounded-cardLg border border-accent-primary/35 bg-linear-to-r from-surface-elevated via-surface-card to-surface-card p-4 shadow-card shadow-glowCyan backdrop-blur-[14px]">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-accent-primary/30 bg-accent-primary/10 text-accent-primary">
            <BellRing className="size-4" strokeWidth={2} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary">
              {notice.label} abierta
            </p>
            <p className="mt-1 text-sm font-semibold text-text-primary">
              {notice.roundsLabel}
            </p>
            <p className="mt-1 text-sm leading-6 text-text-secondary">
              Solo tienes hasta el primer partido de esta ventana para cerrar el
              bracket.
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">
              <span className="inline-flex items-center gap-1 rounded-pill border border-status-warning/30 bg-status-warning/10 px-3 py-1 text-status-warning">
                <Clock3 className="size-3.5" strokeWidth={2} />
                {formatRemaining(notice.effectiveLockAt, now)}
              </span>
              <span className="rounded-pill border border-border-subtle bg-background-secondary/75 px-3 py-1">
                Aviso activo {notice.leadHours}h antes del cierre
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Link
            className="inline-flex h-11 items-center justify-center gap-2 rounded-pill bg-linear-to-r from-accent-primary to-accent-secondary px-5 text-sm font-semibold text-background-main shadow-glowCyan transition-transform duration-200 hover:scale-[0.99]"
            href={notice.ctaHref}
          >
            <Target className="size-4" strokeWidth={2} />
            Ir a eliminatorias
          </Link>
        </div>
      </aside>
    </div>
  );
}
