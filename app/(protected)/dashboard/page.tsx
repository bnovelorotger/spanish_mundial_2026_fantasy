import Link from "next/link";
import { CalendarClock, ChevronRight, Sparkles, Trophy, Users } from "lucide-react";

import { CountdownCard } from "@/components/worldcup/CountdownCard";
import { PhaseBadge } from "@/components/worldcup/PhaseBadge";
import { RankingCard } from "@/components/worldcup/RankingCard";
import {
  getRankingByPhase,
  getRankingStamps,
  getUserGapCopy,
  getUserPointsBreakdown,
} from "@/lib/services/ranking.service";
import { createClient } from "@/lib/supabase/server";

interface ActivityItem {
  id: string;
  text: string;
  timestamp: string;
}

const dashboardModel = {
  activity: [
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
  ] satisfies ActivityItem[],
  countdown: {
    label: "Predictions close in",
    phaseLabel: "Editable",
    timeDisplay: "02d 14h 31m",
    urgency: "normal" as const,
  },
  nextMatch: {
    city: "Mexico City",
    homeTeam: "Mexico",
    kickoff: "June 21 - 19:00",
    phase: "Group Stage",
    stadium: "Estadio Azteca",
    awayTeam: "United States",
  },
};

function entryName(entry: {
  displayName: string | null;
  username: string;
}) {
  return entry.displayName?.trim() || entry.username;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let ranking = null;
  let breakdown = null;

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
    user && ranking ? getUserGapCopy(ranking, user.id) : "Your ranking board will light up once points are on the table.";
  const stamps = breakdown ? getRankingStamps(breakdown, 3) : [];
  const topThree = ranking?.slice(0, 3) ?? [];

  return (
    <div className="space-y-6">
      <CountdownCard {...dashboardModel.countdown} />

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
        <section className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-primary">
            My ranking position
          </p>
          <h2 className="mt-2 text-lg font-semibold text-text-primary">
            Your ranking card lights up once points hit the table.
          </h2>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            Final group standings and recalculated points turn this panel into
            your daily tournament pulse.
          </p>
        </section>
      )}

      <section className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-secondary">
              Next match
            </p>
            <h2 className="mt-2 text-lg font-semibold text-text-primary">
              {dashboardModel.nextMatch.homeTeam} vs{" "}
              {dashboardModel.nextMatch.awayTeam}
            </h2>
          </div>
          <PhaseBadge label="Scheduled" variant="scheduled" />
        </div>

        <div className="mt-5 grid gap-3 rounded-card border border-border-subtle bg-background-secondary/75 p-4">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <CalendarClock className="size-4 text-accent-primary" strokeWidth={2} />
            {dashboardModel.nextMatch.kickoff}
          </div>
          <p className="text-sm text-text-secondary">
            {dashboardModel.nextMatch.phase} - {dashboardModel.nextMatch.city}
          </p>
          <p className="text-sm text-text-muted">
            The calendar is already live, and richer match overlays keep
            expanding from here. Venue: {dashboardModel.nextMatch.stadium}.
          </p>
        </div>
      </section>

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
          {dashboardModel.activity.map((item) => (
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
