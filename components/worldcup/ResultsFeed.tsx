import { Flag, Sparkles, Swords, Trophy } from "lucide-react";

import type {
  ResultsFeedItemViewModel,
  ResultsFeedMatchScoreViewModel,
} from "@/lib/types/worldcup";

import { LocalKickoff } from "./LocalKickoff";
import { PhaseBadge } from "./PhaseBadge";
import { TeamBadge } from "./TeamBadge";

function ImpactSummary({
  description,
  hits,
  misses,
  pointsAwarded,
}: ResultsFeedItemViewModel["impact"]) {
  return (
    <div className="mt-4 rounded-card border border-border-subtle bg-background-secondary/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent-primary">
            Impacto en la liga
          </p>
          <p className="mt-2 text-sm text-text-secondary">{description}</p>
        </div>
        <Sparkles className="size-4 shrink-0 text-accent-primary" strokeWidth={2} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-card border border-border-subtle bg-surface-card/70 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            Aciertos
          </p>
          <p className="mt-1 font-numeric text-xl font-bold text-text-primary">
            {hits}
          </p>
        </div>
        <div className="rounded-card border border-border-subtle bg-surface-card/70 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            Fallos
          </p>
          <p className="mt-1 font-numeric text-xl font-bold text-text-primary">
            {misses}
          </p>
        </div>
        <div className="rounded-card border border-border-subtle bg-surface-card/70 px-3 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-muted">
            Puntos
          </p>
          <p className="mt-1 font-numeric text-xl font-bold text-text-primary">
            {pointsAwarded}
          </p>
        </div>
      </div>
    </div>
  );
}

function MatchScore({
  awayScore,
  awayTeam,
  homeScore,
  homeTeam,
}: ResultsFeedMatchScoreViewModel) {
  return (
    <div className="mt-4 space-y-3">
      <div className="flex items-center justify-between gap-3 rounded-card border border-border-subtle bg-background-secondary/70 px-3 py-3">
        <TeamBadge
          code={homeTeam?.code ?? undefined}
          flagUrl={homeTeam?.flagUrl}
          isPlaceholder={homeTeam?.isTbd ?? true}
          name={homeTeam?.name ?? "Por decidir"}
        />
        <p className="font-numeric text-2xl font-bold text-text-primary">
          {homeScore ?? "-"}
        </p>
      </div>
      <div className="flex items-center justify-between gap-3 rounded-card border border-border-subtle bg-background-secondary/70 px-3 py-3">
        <TeamBadge
          code={awayTeam?.code ?? undefined}
          flagUrl={awayTeam?.flagUrl}
          isPlaceholder={awayTeam?.isTbd ?? true}
          name={awayTeam?.name ?? "Por decidir"}
        />
        <p className="font-numeric text-2xl font-bold text-text-primary">
          {awayScore ?? "-"}
        </p>
      </div>
    </div>
  );
}

function GroupClosureStandings({
  standings,
}: {
  standings: Extract<ResultsFeedItemViewModel, { type: "GROUP_CLOSURE" }>["standings"];
}) {
  return (
    <div className="mt-4 space-y-3">
      {standings.map((entry) => (
        <div
          key={`${entry.position}-${entry.team?.code ?? entry.team?.name ?? "tbd"}`}
          className="flex items-center justify-between gap-3 rounded-card border border-border-subtle bg-background-secondary/70 px-3 py-3"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-card font-numeric text-sm font-bold text-text-primary">
              {entry.position}
            </div>
            <TeamBadge
              code={entry.team?.code ?? undefined}
              flagUrl={entry.team?.flagUrl}
              isPlaceholder={entry.team?.isTbd ?? true}
              name={entry.team?.name ?? "Por decidir"}
            />
          </div>

          <div className="text-right">
            <p className="font-numeric text-lg font-bold text-text-primary">
              {entry.points}
            </p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-text-muted">
              pts
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function badgeForItem(item: ResultsFeedItemViewModel) {
  if (item.type === "GROUP_CLOSURE") {
    return { label: "Grupo cerrado", variant: "saved" as const };
  }

  if (item.type === "GROUP_MATCH_RESULT") {
    return { label: "Impacto pendiente", variant: "pending" as const };
  }

  if (item.type === "FINAL_RESULT") {
    return { label: "Final resuelta", variant: "finished" as const };
  }

  return { label: "Cruce resuelto", variant: "finished" as const };
}

function iconForItem(item: ResultsFeedItemViewModel) {
  if (item.type === "GROUP_CLOSURE") {
    return Trophy;
  }

  if (item.type === "GROUP_MATCH_RESULT") {
    return Flag;
  }

  return Swords;
}

export function ResultsFeed({ items }: { items: ResultsFeedItemViewModel[] }) {
  return (
    <section className="space-y-4">
      {items.map((item) => {
        const badge = badgeForItem(item);
        const Icon = iconForItem(item);

        return (
          <article
            key={item.id}
            className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-secondary">
                  {item.type === "GROUP_CLOSURE"
                    ? `Grupo ${item.groupLetter}`
                    : item.type === "GROUP_MATCH_RESULT"
                      ? `Grupo ${item.groupLetter}`
                      : item.phase === "FINAL"
                        ? "Final"
                        : item.phase.replaceAll("_", " ")}
                </p>
                <h2 className="mt-2 text-lg font-semibold text-text-primary">
                  {item.title}
                </h2>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <PhaseBadge label={badge.label} variant={badge.variant} />
                <Icon className="size-5 text-text-muted" strokeWidth={2} />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
              {item.type === "GROUP_CLOSURE" ? (
                <span>Cierre consolidado del grupo</span>
              ) : (
                <span>
                  <LocalKickoff isoUtc={item.kickoff} separator=" · " />
                </span>
              )}
              {item.type !== "GROUP_CLOSURE" && item.city ? <span>· {item.city}</span> : null}
              {item.type !== "GROUP_CLOSURE" && item.venue ? <span>· {item.venue}</span> : null}
            </div>

            {item.type === "GROUP_CLOSURE" ? (
              <GroupClosureStandings standings={item.standings} />
            ) : (
              <MatchScore {...item.score} />
            )}

            {item.type === "FINAL_RESULT" && item.championBonusPointsAwarded > 0 ? (
              <div className="mt-4 rounded-card border border-accent-primary/25 bg-accent-primary/10 px-4 py-3 text-sm text-text-secondary">
                <p className="font-semibold text-text-primary">
                  El bonus de campeón ya golpeó la liga.
                </p>
                <p className="mt-1">
                  Esta final repartió {item.championBonusPointsAwarded} puntos extra por campeón.
                </p>
              </div>
            ) : null}

            <ImpactSummary {...item.impact} />
          </article>
        );
      })}
    </section>
  );
}
