import Link from "next/link";
import { ArrowUpRight, Crown, Users } from "lucide-react";

import type { ParticipantExplorerEntryViewModel } from "@/lib/types/worldcup";

import { RankingAvatar } from "./RankingAvatar";

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function ParticipantExplorerList({
  entries,
}: {
  entries: ParticipantExplorerEntryViewModel[];
}) {
  return (
    <section className="space-y-4">
      {entries.map((entry) => (
        <Link
          key={entry.userId}
          className="focus-ring block rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card transition duration-200 hover:border-accent-primary/25 hover:bg-surface-card"
          href={`/ranking/participants/${entry.userId}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-background-secondary font-numeric text-sm font-bold text-text-primary">
                #{entry.position}
              </div>
              <RankingAvatar
                avatarUrl={entry.avatarUrl}
                className="size-11 shrink-0"
                fallback={initialsFromName(entry.displayName)}
                name={entry.displayName}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-base font-semibold text-text-primary">
                    {entry.displayName}
                  </p>
                  {entry.isCurrentUser ? (
                    <span className="inline-flex items-center gap-1 rounded-pill border border-accent-primary/30 bg-accent-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-text-primary">
                      <Crown className="size-3 text-accent-primary" strokeWidth={2} />
                      Tú
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-text-secondary">@{entry.username}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-text-primary">
              <ArrowUpRight className="size-4 text-accent-primary" strokeWidth={2} />
              Ver
            </div>
          </div>

          <div className="mt-4 grid grid-cols-4 gap-3">
            <div className="rounded-card border border-border-subtle bg-background-secondary/70 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                Total
              </p>
              <p className="mt-1 font-numeric text-xl font-bold text-text-primary">
                {entry.totalPoints}
              </p>
            </div>
            <div className="rounded-card border border-border-subtle bg-background-secondary/70 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                Grupos
              </p>
              <p className="mt-1 font-numeric text-xl font-bold text-text-primary">
                {entry.groupPoints}
              </p>
            </div>
            <div className="rounded-card border border-border-subtle bg-background-secondary/70 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                KO
              </p>
              <p className="mt-1 font-numeric text-xl font-bold text-text-primary">
                {entry.knockoutPoints}
              </p>
            </div>
            <div className="rounded-card border border-border-subtle bg-background-secondary/70 px-3 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
                Campeón
              </p>
              <p className="mt-1 font-numeric text-xl font-bold text-text-primary">
                {entry.championPoints}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 text-sm text-text-secondary">
            <Users className="size-4 text-accent-secondary" strokeWidth={2} />
            <p>Explora su cuadro bloqueado, grupos y puntos ya revelables.</p>
          </div>
        </Link>
      ))}
    </section>
  );
}
