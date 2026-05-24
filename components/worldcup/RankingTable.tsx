import {
  ArrowUpRight,
  Crown,
  Medal,
  Sparkles,
  Trophy,
} from "lucide-react";

import type { RankingEntry } from "@/lib/types/worldcup";
import { cn } from "@/lib/utils";

interface RankingTableProps {
  currentUserId: string;
  entries: RankingEntry[];
}

function entryName(entry: RankingEntry) {
  return entry.displayName?.trim() || entry.username;
}

function initialsFromEntry(entry: RankingEntry) {
  return entryName(entry)
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function podiumGapCopy(entry: RankingEntry, leaderPoints: number) {
  if (entry.position === 1) {
    return "Sets the pace under the stadium lights.";
  }

  return `${leaderPoints - entry.totalPoints} pts behind the leader.`;
}

const podiumToneStyles: Record<number, string> = {
  1: "border-podium-gold/50 bg-podium-gold/10",
  2: "border-podium-silver/50 bg-podium-silver/10",
  3: "border-podium-bronze/50 bg-podium-bronze/10",
};

export function RankingTable({
  currentUserId,
  entries,
}: RankingTableProps) {
  const leaderPoints = entries[0]?.totalPoints ?? 0;
  const podiumEntries = entries.slice(0, 3);
  const currentUserEntry = entries.find((entry) => entry.userId === currentUserId) ?? null;
  const currentUserIsOutsidePodium =
    currentUserEntry !== null && currentUserEntry.position > 3;

  return (
    <section className="space-y-5">
      <div className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-podium-gold">
              League ranking
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-text-primary">
              The trophy board is live.
            </h2>
          </div>
          <Trophy className="size-5 text-podium-gold" strokeWidth={2} />
        </div>

        {podiumEntries.length > 0 ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-[1.15fr_repeat(2,1fr)]">
            {podiumEntries.map((entry) => {
              const isCurrentUser = entry.userId === currentUserId;

              return (
                <article
                  key={entry.userId}
                  className={cn(
                    "rounded-cardLg border p-4 shadow-card",
                    podiumToneStyles[entry.position] ?? "border-border-subtle bg-background-secondary/70",
                    isCurrentUser &&
                      "border-accent-primary/45 bg-linear-to-b from-surface-elevated to-surface-card shadow-glowCyan",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="inline-flex size-11 items-center justify-center rounded-full border border-border-subtle bg-surface-card font-numeric text-lg font-bold text-text-primary">
                      #{entry.position}
                    </div>
                    {isCurrentUser ? (
                      <div className="inline-flex items-center gap-2 rounded-pill border border-accent-primary/30 bg-accent-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-primary">
                        <Crown className="size-3.5 text-accent-primary" strokeWidth={2} />
                        You
                      </div>
                    ) : (
                      <Medal className="size-5 text-text-primary" strokeWidth={2} />
                    )}
                  </div>

                  <div className="mt-4">
                    <p className="text-lg font-semibold text-text-primary">
                      {entryName(entry)}
                    </p>
                    <p className="mt-1 text-sm text-text-secondary">
                      {podiumGapCopy(entry, leaderPoints)}
                    </p>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                        Total points
                      </p>
                      <p className="mt-1 font-numeric text-3xl font-bold text-text-primary">
                        {entry.totalPoints}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                      <ArrowUpRight className="size-4 text-status-success" strokeWidth={2} />
                      Gap {entry.gapToLeader}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-card border border-border-subtle bg-background-secondary/70 p-4">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-primary">
              Your tournament starts here.
            </p>
            <p className="mt-2 text-sm leading-6 text-text-secondary">
              The ranking board fills up as soon as league profiles and points
              are on the table.
            </p>
          </div>
        )}
      </div>

      {currentUserIsOutsidePodium && currentUserEntry ? (
        <div className="rounded-cardLg border border-accent-primary/35 bg-linear-to-b from-surface-elevated to-surface-card p-4 shadow-glowCyan">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-primary">
                Pinned row
              </p>
              <p className="mt-1 text-sm text-text-secondary">
                Your league line stays visible even when the table gets crowded.
              </p>
            </div>
            <Sparkles className="size-5 text-accent-primary" strokeWidth={2} />
          </div>

          <div className="mt-4 rounded-card border border-accent-primary/30 bg-background-secondary/70 px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-accent-primary/30 bg-accent-primary/10 font-semibold uppercase tracking-[0.12em] text-accent-primary">
                  {initialsFromEntry(currentUserEntry)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-text-primary">
                    #{currentUserEntry.position} {entryName(currentUserEntry)}
                  </p>
                  <div className="mt-1 inline-flex items-center gap-2 rounded-pill border border-accent-primary/25 bg-accent-primary/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-primary">
                    <Crown className="size-3.5 text-accent-primary" strokeWidth={2} />
                    You
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-numeric text-2xl font-bold text-text-primary">
                  {currentUserEntry.totalPoints}
                </p>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
                  Gap {currentUserEntry.gapToLeader}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-secondary">
              Full table
            </p>
            <h3 className="mt-2 text-lg font-semibold text-text-primary">
              Top 10 with your line highlighted.
            </h3>
          </div>
          <Medal className="size-5 text-accent-secondary" strokeWidth={2} />
        </div>

        <div className="mt-5 space-y-3">
          {entries.length > 0 ? (
            entries.map((entry) => {
              const isCurrentUser = entry.userId === currentUserId;

              return (
                <article
                  key={`table-${entry.userId}`}
                  className={cn(
                    "flex items-center justify-between gap-4 rounded-card border px-4 py-3",
                    isCurrentUser
                      ? "border-accent-primary/35 bg-surface-active shadow-glowCyan"
                      : "border-border-subtle bg-background-secondary/70",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-card font-numeric text-base font-bold text-text-primary">
                      #{entry.position}
                    </div>
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-card text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary">
                      {initialsFromEntry(entry)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-text-primary">
                        {entryName(entry)}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-text-muted">
                        {isCurrentUser ? (
                          <span className="inline-flex items-center gap-1 rounded-pill border border-accent-primary/25 bg-accent-primary/10 px-2 py-0.5 text-text-primary">
                            <Crown className="size-3 text-accent-primary" strokeWidth={2} />
                            You
                          </span>
                        ) : null}
                        <span className="inline-flex items-center gap-1">
                          <ArrowUpRight className="size-3 text-status-success" strokeWidth={2} />
                          Gap {entry.gapToLeader}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-numeric text-2xl font-bold text-text-primary">
                      {entry.totalPoints}
                    </p>
                    <p className="text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
                      {entry.groupPoints} group
                    </p>
                  </div>
                </article>
              );
            })
          ) : (
            <div className="rounded-card border border-border-subtle bg-background-secondary/70 p-4">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-primary">
                Your tournament starts here.
              </p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Once the first predictions are scored, this table becomes the
                daily race to watch.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
