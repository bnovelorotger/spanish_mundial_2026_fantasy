"use client";

import { Trophy } from "lucide-react";
import { useEffect, useState } from "react";

import type { FinalCelebrationSummary } from "@/lib/services/matches.service";

const CONFETTI_TONES = [
  "bg-accent-primary",
  "bg-accent-secondary",
  "bg-status-success",
  "bg-status-warning",
  "bg-podium-gold",
  "bg-status-live",
] as const;

const CONFETTI_PIECES = Array.from({ length: 42 }, (_, index) => ({
  delay: `${(index % 7) * 0.07}s`,
  drift: `${((index % 2 === 0 ? 1 : -1) * (36 + (index % 5) * 12))}px`,
  duration: `${2.6 + (index % 5) * 0.18}s`,
  left: `${(index * 11) % 100}%`,
  rotation: `${(index % 2 === 0 ? 1 : -1) * (18 + (index % 6) * 9)}deg`,
  tone: CONFETTI_TONES[index % CONFETTI_TONES.length],
}));

export function FinalConfettiOverlay({
  summary,
}: {
  summary: FinalCelebrationSummary;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const celebrationKey = `final-confetti:${summary.matchId}:${summary.winnerSide}`;

    if (window.sessionStorage.getItem(celebrationKey) === "seen") {
      return;
    }

    window.sessionStorage.setItem(celebrationKey, "seen");
    const showTimeout = window.setTimeout(() => {
      setIsVisible(true);
    }, 0);

    const hideTimeout = window.setTimeout(() => {
      setIsVisible(false);
    }, 4200);

    return () => {
      window.clearTimeout(showTimeout);
      window.clearTimeout(hideTimeout);
    };
  }, [summary.matchId, summary.winnerSide]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-48 bg-linear-to-b from-accent-primary/10 via-accent-secondary/6 to-transparent" />

      {CONFETTI_PIECES.map((piece, index) => (
        <span
          key={`${summary.matchId}-confetti-${index}`}
          className={`final-confetti-piece ${piece.tone}`}
          style={{
            animationDelay: piece.delay,
            animationDuration: piece.duration,
            left: piece.left,
            ["--confetti-drift" as string]: piece.drift,
            ["--confetti-rotation" as string]: piece.rotation,
          }}
        />
      ))}

      <div className="absolute inset-x-4 top-6 flex justify-center sm:top-10">
        <div className="final-celebration-card w-full max-w-sm rounded-cardLg border border-accent-primary/35 bg-surface-elevated/94 px-5 py-4 shadow-glowCyan backdrop-blur">
          <div className="flex items-center justify-center gap-2 text-podium-gold">
            <Trophy className="size-5" strokeWidth={2} />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-podium-gold">
              Final cerrada
            </p>
          </div>
          <p className="mt-3 text-center font-numeric text-2xl font-bold text-text-primary">
            {summary.winnerName}
          </p>
          <p className="mt-1 text-center text-sm text-text-secondary">
            Campeona del mundo ante {summary.winnerName === summary.homeTeamName ? summary.awayTeamName : summary.homeTeamName}.
          </p>
        </div>
      </div>
    </div>
  );
}
