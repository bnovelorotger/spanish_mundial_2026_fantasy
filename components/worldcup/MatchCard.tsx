import { CalendarClock, MapPin, Shield, Tv } from "lucide-react";

import type {
  MatchCardViewModel,
  MatchPhase,
  MatchStatus,
} from "@/lib/types/worldcup";
import { cn } from "@/lib/utils";

import { LocalKickoff } from "./LocalKickoff";
import { PhaseBadge } from "./PhaseBadge";
import { TeamBadge } from "./TeamBadge";

type MatchCardVariant = "compact" | "premium";

interface MatchCardProps {
  dataTour?: string;
  match: MatchCardViewModel;
  variant?: MatchCardVariant;
}

const groupAccentStyles: Record<string, string> = {
  A: "border-group-a/70",
  B: "border-group-b/70",
  C: "border-group-c/70",
  D: "border-group-d/70",
  E: "border-group-e/70",
  F: "border-group-f/70",
  G: "border-group-g/70",
  H: "border-group-h/70",
  I: "border-group-i/70",
  J: "border-group-j/70",
  K: "border-group-k/70",
  L: "border-group-l/70",
};

const phaseLabels: Record<MatchPhase, string> = {
  FINAL: "Final",
  GROUP_STAGE: "Fase de grupos",
  QUARTER_FINALS: "Cuartos de final",
  ROUND_OF_16: "Octavos de final",
  ROUND_OF_32: "Dieciseisavos de final",
  SEMI_FINALS: "Semifinales",
  THIRD_PLACE: "Tercer puesto",
};

function badgeVariantForStatus(status: MatchStatus) {
  switch (status) {
    case "LIVE":
      return { label: "EN DIRECTO", variant: "live" as const };
    case "FINISHED":
      return { label: "Finalizado", variant: "finished" as const };
    case "POSTPONED":
      return { label: "Aplazado", variant: "locked" as const };
    case "CANCELLED":
      return { label: "Cancelado", variant: "locked" as const };
    default:
      return { label: "Programado", variant: "scheduled" as const };
  }
}

function teamDisplay(match: MatchCardViewModel, side: "away" | "home") {
  const team = side === "home" ? match.homeTeam : match.awayTeam;
  const placeholder =
    side === "home" ? match.homePlaceholder : match.awayPlaceholder;

  if (team) {
    return {
      code: team.code,
      flagUrl: team.flagUrl,
      isPlaceholder: team.isTbd,
      name: team.name,
    };
  }

  return {
    code: undefined,
    flagUrl: null,
    isPlaceholder: true,
    name: placeholder ?? "Por decidir",
  };
}

export function MatchCard({
  dataTour,
  match,
  variant = "compact",
}: MatchCardProps) {
  const statusBadge = badgeVariantForStatus(match.status);
  const home = teamDisplay(match, "home");
  const away = teamDisplay(match, "away");
  const isPremium = variant === "premium";
  const accentBorder = match.groupLetter
    ? groupAccentStyles[match.groupLetter]
    : "border-accent-primary/20";

  return (
    <article
      className={cn(
        "rounded-cardLg border bg-surface-card/90 p-5 shadow-card",
        isPremium
          ? "bg-linear-to-b from-surface-elevated to-surface-card"
          : "bg-surface-card/90",
        accentBorder,
      )}
      data-tour={dataTour}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium uppercase tracking-[0.16em] text-text-secondary">
              {phaseLabels[match.phase]}
            </p>
            {match.groupLetter ? (
              <span className="rounded-pill border border-border-subtle bg-background-secondary/75 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                Grupo {match.groupLetter}
              </span>
            ) : null}
            {match.isOnRtve ? (
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-accent-primary/35 bg-accent-primary/10 px-2.5 py-1 text-[11px] font-semibold text-accent-primary">
                <Tv className="size-3.5" strokeWidth={2} />
                En RTVE
              </span>
            ) : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-3.5 text-accent-primary" strokeWidth={2} />
              <LocalKickoff isoUtc={match.kickoff} separator=" · " />
            </span>
            {match.city || match.venue ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5 text-accent-secondary" strokeWidth={2} />
                {[match.city, match.venue].filter(Boolean).join(" · ")}
              </span>
            ) : null}
          </div>
        </div>

        <PhaseBadge label={statusBadge.label} variant={statusBadge.variant} />
      </div>

      <div className="mt-5 grid gap-4">
        <div className="flex items-center justify-between gap-4 rounded-card border border-border-subtle bg-background-secondary/55 px-4 py-3">
          <TeamBadge
            code={home.code}
            flagUrl={home.flagUrl}
            highlighted
            isPlaceholder={home.isPlaceholder}
            name={home.name}
          />
          <p className="font-numeric text-2xl font-bold text-text-primary sm:text-3xl">
            {match.homeScore ?? "-"}
          </p>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-card border border-border-subtle bg-background-secondary/55 px-4 py-3">
          <TeamBadge
            code={away.code}
            flagUrl={away.flagUrl}
            highlighted
            isPlaceholder={away.isPlaceholder}
            name={away.name}
          />
          <p className="font-numeric text-2xl font-bold text-text-primary sm:text-3xl">
            {match.awayScore ?? "-"}
          </p>
        </div>
      </div>

      {isPremium ? (
        <div className="mt-4 rounded-card border border-border-subtle bg-background-secondary/65 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-text-secondary">
            <Shield className="size-4 text-accent-primary" strokeWidth={2} />
            Partido #{match.matchNumber}
          </div>
          <p className="mt-2 text-sm leading-6 text-text-muted">
            Las capas de pronóstico y puntos llegarán en fases posteriores. Por
            ahora, esta tarjeta premium se centra en la hora, el lugar, el
            estado y el marcador del partido.
          </p>
        </div>
      ) : null}
    </article>
  );
}
