import Link from "next/link";
import { CalendarClock, ChevronRight, Sparkles, Trophy, Users } from "lucide-react";

import { CountdownCard } from "@/components/worldcup/CountdownCard";
import { PhaseBadge } from "@/components/worldcup/PhaseBadge";
import { RankingCard } from "@/components/worldcup/RankingCard";

interface ActivityItem {
  id: string;
  text: string;
  timestamp: string;
}

interface LeaderboardEntry {
  id: string;
  name: string;
  points: number;
  position: number;
}

const dashboardModel = {
  activity: [
    {
      id: "a1",
      text: "League chat is heating up before the group stage lock.",
      timestamp: "2h ago",
    },
    {
      id: "a2",
      text: "Top 10 table placeholder is ready for the first synced results.",
      timestamp: "Today",
    },
  ] satisfies ActivityItem[],
  countdown: {
    label: "Predictions close in",
    phaseLabel: "Editable",
    timeDisplay: "02d 14h 31m",
    urgency: "normal" as const,
  },
  leaderboard: [
    { id: "l1", name: "Carlos", points: 24, position: 1 },
    { id: "l2", name: "You", points: 20, position: 2 },
    { id: "l3", name: "Sofia", points: 18, position: 3 },
  ] satisfies LeaderboardEntry[],
  nextMatch: {
    city: "Mexico City",
    homeTeam: "Mexico",
    kickoff: "June 21 · 19:00",
    phase: "Group Stage",
    stadium: "Estadio Azteca",
    awayTeam: "United States",
  },
  ranking: {
    accentLabel: "My ranking position",
    gapCopy: "You're 4 pts behind Carlos.",
    points: 20,
    position: 2,
    title: "Your tournament pulse",
  },
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <CountdownCard {...dashboardModel.countdown} />

      <RankingCard {...dashboardModel.ranking} highlighted />

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
            {dashboardModel.nextMatch.phase} · {dashboardModel.nextMatch.city}
          </p>
          <p className="text-sm text-text-muted">
            Placeholder match card styling lands in Phase 5. Venue:
            {" "}
            {dashboardModel.nextMatch.stadium}.
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
              Groups are open. Make your first picks before the deadline.
            </h2>
          </div>
          <Sparkles className="size-5 text-accent-primary" strokeWidth={2} />
        </div>

        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Group editors arrive in Phase 6. The shell is ready so the tournament
          already feels live before prediction logic lands.
        </p>

        <Link
          className="mt-5 inline-flex h-12 items-center justify-center rounded-pill bg-linear-to-r from-accent-primary to-accent-secondary px-6 text-sm font-semibold text-background-main shadow-glowCyan transition-transform duration-200 hover:scale-[0.99]"
          href="/predictions"
        >
          View prediction shell
        </Link>
      </section>

      <section className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-primary">
              Top ranking
            </p>
            <h2 className="mt-2 text-lg font-semibold text-text-primary">
              The trophy board starts here.
            </h2>
          </div>
          <Trophy className="size-5 text-podium-gold" strokeWidth={2} />
        </div>

        <div className="mt-5 space-y-3">
          {dashboardModel.leaderboard.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-card border border-border-subtle bg-background-secondary/75 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-text-primary">
                  #{entry.position} {entry.name}
                </p>
                <p className="text-xs text-text-muted">
                  Ranking detail card arrives in Phase 7.
                </p>
              </div>
              <p className="font-numeric text-xl font-bold text-text-primary">
                {entry.points}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-secondary">
              Activity feed
            </p>
            <h2 className="mt-2 text-lg font-semibold text-text-primary">
              Your friends-only tournament is warming up.
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
