import type { SupabaseClient } from "@supabase/supabase-js";
import Link from "next/link";
import {
  CalendarClock,
  ChevronRight,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";

import { StateCard } from "@/components/ui/StateCard";
import {
  CountdownCard,
  type CountdownUrgency,
} from "@/components/worldcup/CountdownCard";
import { LocalKickoff } from "@/components/worldcup/LocalKickoff";
import { PhaseBadge } from "@/components/worldcup/PhaseBadge";
import { RankingCard } from "@/components/worldcup/RankingCard";
import { getNextOpenLock } from "@/lib/services/locks.service";
import { getNextScheduledMatch } from "@/lib/services/matches.service";
import {
  getRankingByPhase,
  getRankingStamps,
  getUserGapCopy,
  getUserPointsBreakdown,
} from "@/lib/services/ranking.service";
import { createClient } from "@/lib/supabase/server";
import type {
  LockPhase,
  MatchCardViewModel,
  MatchPhase,
} from "@/lib/types/worldcup";

interface ActivityItem {
  id: string;
  text: string;
  timestamp: string;
}

interface DashboardCountdownModel {
  description: string;
  label: string;
  phaseLabel: string;
  state: "active" | "finished";
  timeDisplay: string;
  urgency?: CountdownUrgency;
}

const activityFeed = [
  {
    id: "a1",
    text: "The first group-stage points are now driving the friends-only race.",
    timestamp: "Live",
  },
  {
    id: "a2",
    text: "Every saved group order is now one step closer to the podium board.",
    timestamp: "Today",
  },
] satisfies ActivityItem[];

const matchPhaseLabels: Record<MatchPhase, string> = {
  FINAL: "Final",
  GROUP_STAGE: "Group Stage",
  QUARTER_FINALS: "Quarter-finals",
  ROUND_OF_16: "Round of 16",
  ROUND_OF_32: "Round of 32",
  SEMI_FINALS: "Semi-finals",
  THIRD_PLACE: "Third place",
};

const lockPhaseLabels: Record<LockPhase, string> = {
  CHAMPION: "Champion",
  FINAL: "Final",
  GROUP_STAGE: "Group stage",
  QUARTER_FINALS: "Quarter-finals",
  ROUND_OF_16: "Round of 16",
  ROUND_OF_32: "Round of 32",
  SEMI_FINALS: "Semi-finals",
  THIRD_PLACE: "Third place",
};

function entryName(entry: {
  displayName: string | null;
  username: string;
}) {
  return entry.displayName?.trim() || entry.username;
}

function teamName(
  team: MatchCardViewModel["homeTeam"],
  placeholder: string | null,
) {
  return team?.name ?? placeholder ?? "TBD";
}

function formatRemainingLockTime(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1000));
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  if (remainingMs > 24 * 60 * 60 * 1000) {
    return `${totalDays}d ${totalHours % 24}h`;
  }

  if (remainingMs > 60 * 60 * 1000) {
    return `${totalHours}h ${totalMinutes % 60}m`;
  }

  return `${totalMinutes}m ${totalSeconds % 60}s`;
}

function countdownUrgency(remainingMs: number): CountdownUrgency {
  if (remainingMs > 24 * 60 * 60 * 1000) {
    return "normal";
  }

  if (remainingMs > 2 * 60 * 60 * 1000) {
    return "warning";
  }

  return "critical";
}

async function getDashboardCountdown(
  supabase: SupabaseClient,
  now: Date,
) {
  const nextOpenLock = await getNextOpenLock(supabase, now);

  if (!nextOpenLock?.lock_at) {
    return {
      description:
        "Every prediction window is now closed. The live table moves again when fresh results land.",
      label: "Predictions close in",
      phaseLabel: "Finished",
      state: "finished",
      timeDisplay: "All locked",
    } satisfies DashboardCountdownModel;
  }

  const remainingMs =
    new Date(nextOpenLock.lock_at).getTime() - now.getTime();

  return {
    description: `Next lock window: ${lockPhaseLabels[nextOpenLock.phase]}.`,
    label: "Predictions close in",
    phaseLabel: lockPhaseLabels[nextOpenLock.phase],
    state: "active",
    timeDisplay: formatRemainingLockTime(remainingMs),
    urgency: countdownUrgency(remainingMs),
  } satisfies DashboardCountdownModel;
}

export default async function DashboardPage() {
  const now = new Date();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let ranking = null;
  let breakdown = null;
  let nextMatch = null;
  let countdown: DashboardCountdownModel = {
    description:
      "Every prediction window is now closed. The live table moves again when fresh results land.",
    label: "Predictions close in",
    phaseLabel: "Finished",
    state: "finished",
    timeDisplay: "All locked",
  };

  try {
    [countdown, nextMatch] = await Promise.all([
      getDashboardCountdown(supabase, now),
      getNextScheduledMatch(supabase, now),
    ]);
  } catch {
    countdown = {
      description:
        "The next prediction deadline is loading from the tournament board. Refresh in a moment.",
      label: "Predictions close in",
      phaseLabel: "Error",
      state: "finished",
      timeDisplay: "--",
    };
    nextMatch = null;
  }

  if (user) {
    try {
      [ranking, breakdown] = await Promise.all([
        getRankingByPhase(supabase),
        getUserPointsBreakdown(supabase, user.id),
      ]);
    } catch {
      ranking = null;
      breakdown = null;
    }
  }

  const userEntry =
    user && ranking ? ranking.find((entry) => entry.userId === user.id) ?? null : null;
  const gapCopy =
    user && ranking
      ? getUserGapCopy(ranking, user.id)
      : "Your ranking board will light up once points are on the table.";
  const stamps = breakdown ? getRankingStamps(breakdown, 3) : [];
  const topThree = ranking?.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      <CountdownCard {...countdown} />

      {userEntry && breakdown ? (
        <RankingCard
          accentLabel="My ranking position"
          breakdown={{
            champion: breakdown.champion,
            groupStage: breakdown.groupStage,
            knockout: breakdown.knockout,
          }}
          gapCopy={gapCopy}
          highlighted
          points={userEntry.totalPoints}
          position={userEntry.position}
          stamps={stamps}
          title="Your tournament pulse"
        />
      ) : (
        <StateCard
          description="Final group standings and recalculated points turn this panel into your daily tournament pulse."
          eyebrow="My ranking position"
          title="Your ranking card lights up once points hit the table."
          tone="default"
        />
      )}

      {nextMatch ? (
        <section className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-secondary">
                Next match
              </p>
              <h2 className="mt-2 text-lg font-semibold text-text-primary">
                {teamName(nextMatch.homeTeam, nextMatch.homePlaceholder)} vs{" "}
                {teamName(nextMatch.awayTeam, nextMatch.awayPlaceholder)}
              </h2>
            </div>
            <PhaseBadge label="Scheduled" variant="scheduled" />
          </div>

          <div className="mt-5 grid gap-3 rounded-card border border-border-subtle bg-background-secondary/75 p-4">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <CalendarClock className="size-4 text-accent-primary" strokeWidth={2} />
              <LocalKickoff isoUtc={nextMatch.kickoff} separator=" · " />
            </div>
            <p className="text-sm text-text-secondary">
              {matchPhaseLabels[nextMatch.phase]}
              {nextMatch.city ? ` - ${nextMatch.city}` : ""}
            </p>
            <p className="text-sm text-text-muted">
              The live calendar is now wired to tournament data. Venue:{" "}
              {nextMatch.venue ?? "TBA"}.
            </p>
          </div>
        </section>
      ) : (
        <StateCard
          description="The next scheduled kickoff will appear here as soon as the live tournament calendar has another open match."
          eyebrow="Next match"
          title="No upcoming kickoff is on the board right now."
          tone="default"
        />
      )}

      <section className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-status-warning">
              Pending predictions
            </p>
            <h2 className="mt-2 text-lg font-semibold text-text-primary">
              Group picks are live. Keep stacking locked-in order before kickoff.
            </h2>
          </div>
          <Sparkles className="size-5 text-accent-primary" strokeWidth={2} />
        </div>

        <p className="mt-3 text-sm leading-6 text-text-secondary">
          The editor is open, the lock rules are active, and every saved group
          now feeds straight into the ranking race.
        </p>

        <Link
          className="mt-5 inline-flex h-12 items-center justify-center rounded-pill bg-linear-to-r from-accent-primary to-accent-secondary px-6 text-sm font-semibold text-background-main shadow-glowCyan transition-transform duration-200 hover:scale-[0.99]"
          href="/predictions"
        >
          Make your picks
        </Link>
      </section>

      <section className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-primary">
              Top ranking
            </p>
            <h2 className="mt-2 text-lg font-semibold text-text-primary">
              The trophy board is now driving the league.
            </h2>
          </div>
          <Trophy className="size-5 text-podium-gold" strokeWidth={2} />
        </div>

        <div className="mt-5 space-y-3">
          {topThree.length > 0 ? (
            topThree.map((entry) => (
              <div
                key={entry.userId}
                className="flex items-center justify-between rounded-card border border-border-subtle bg-background-secondary/75 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-text-primary">
                    #{entry.position} {entryName(entry)}
                  </p>
                  <p className="text-xs text-text-muted">
                    Gap {entry.gapToLeader} - {entry.groupPoints} group pts
                  </p>
                </div>
                <p className="font-numeric text-xl font-bold text-text-primary">
                  {entry.totalPoints}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-card border border-border-subtle bg-background-secondary/75 p-4">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-primary">
                Your tournament starts here.
              </p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                The podium fills up once final standings and scored picks hit the
                board.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-secondary">
              Activity feed
            </p>
            <h2 className="mt-2 text-lg font-semibold text-text-primary">
              Your friends-only tournament is heating up.
            </h2>
          </div>
          <Users className="size-5 text-accent-secondary" strokeWidth={2} />
        </div>

        <div className="mt-5 space-y-3">
          {activityFeed.map((item) => (
            <article
              key={item.id}
              className="rounded-card border border-border-subtle bg-background-secondary/75 p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm leading-6 text-text-secondary">{item.text}</p>
                <ChevronRight
                  className="size-4 shrink-0 text-text-muted"
                  strokeWidth={2}
                />
              </div>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
                {item.timestamp}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
