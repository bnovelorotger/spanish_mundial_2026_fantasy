import { Lock, Sparkles } from "lucide-react";

import type {
  ParticipantGroupPredictionViewModel,
  PhaseLockViewModel,
} from "@/lib/types/worldcup";

import { StateCard } from "@/components/ui/StateCard";

import { TeamBadge } from "./TeamBadge";

function groupAccent(groupLetter: ParticipantGroupPredictionViewModel["groupLetter"]) {
  switch (groupLetter) {
    case "A":
      return "border-t-group-a";
    case "B":
      return "border-t-group-b";
    case "C":
      return "border-t-group-c";
    case "D":
      return "border-t-group-d";
    case "E":
      return "border-t-group-e";
    case "F":
      return "border-t-group-f";
    case "G":
      return "border-t-group-g";
    case "H":
      return "border-t-group-h";
    case "I":
      return "border-t-group-i";
    case "J":
      return "border-t-group-j";
    case "K":
      return "border-t-group-k";
    case "L":
      return "border-t-group-l";
  }
}

function groupText(groupLetter: ParticipantGroupPredictionViewModel["groupLetter"]) {
  switch (groupLetter) {
    case "A":
      return "text-group-a";
    case "B":
      return "text-group-b";
    case "C":
      return "text-group-c";
    case "D":
      return "text-group-d";
    case "E":
      return "text-group-e";
    case "F":
      return "text-group-f";
    case "G":
      return "text-group-g";
    case "H":
      return "text-group-h";
    case "I":
      return "text-group-i";
    case "J":
      return "text-group-j";
    case "K":
      return "text-group-k";
    case "L":
      return "text-group-l";
  }
}

function stampLabel(team: ParticipantGroupPredictionViewModel["teams"][number]) {
  if (team.pointsAwarded === null) {
    return "Pendiente";
  }

  if (team.pointsAwarded === 0) {
    return "Fallo";
  }

  return `${team.pointsAwarded === 1 ? "+1 pto" : `+${team.pointsAwarded} pts`}`;
}

function lockCopy(lock: PhaseLockViewModel, isCurrentUser: boolean) {
  if (isCurrentUser) {
    return "Tus grupos se muestran aquí en modo lectura para revisar lo ya guardado.";
  }

  if (lock.isLocked) {
    return "La fase de grupos ya cerró y estos picks ya se pueden explorar.";
  }

  return "Los picks de grupos se revelan en cuanto cierre la fase de grupos.";
}

export function ReadonlyGroupPredictions({
  groupLock,
  groups,
  isCurrentUser,
}: {
  groupLock: PhaseLockViewModel;
  groups: ParticipantGroupPredictionViewModel[];
  isCurrentUser: boolean;
}) {
  const isHidden = !isCurrentUser && !groupLock.isLocked;

  if (isHidden) {
    return (
      <StateCard
        description={lockCopy(groupLock, isCurrentUser)}
        eyebrow="Grupos protegidos"
        title="Este bloque se abre cuando cierre la fase de grupos."
        tone="warning"
      />
    );
  }

  return (
    <section className="space-y-4">
      <div className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-secondary">
              Grupos
            </p>
            <h2 className="mt-2 text-xl font-semibold text-text-primary">
              El tablero de grupos ya se puede leer sin tocar nada.
            </h2>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              {lockCopy(groupLock, isCurrentUser)}
            </p>
          </div>
          {groupLock.isLocked ? (
            <Sparkles className="size-5 text-accent-primary" strokeWidth={2} />
          ) : (
            <Lock className="size-5 text-status-warning" strokeWidth={2} />
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {groups.map((group) => (
          <article
            key={group.groupLetter}
            className={`rounded-cardLg border border-border-subtle border-t-4 bg-surface-card/90 p-5 shadow-card ${groupAccent(group.groupLetter)}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p
                  className={`text-sm font-medium uppercase tracking-[0.18em] ${groupText(group.groupLetter)}`}
                >
                  Grupo {group.groupLetter}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-text-primary">
                  {group.savedCount > 0
                    ? "Pick guardado"
                    : "Sin pick guardado"}
                </h3>
              </div>
              <span
                className={
                  group.isFinal
                    ? "inline-flex rounded-pill border border-status-success/30 bg-status-success/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-status-success"
                    : "inline-flex rounded-pill border border-status-warning/30 bg-status-warning/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-status-warning"
                }
              >
                {group.isFinal ? "Resuelto" : "Pendiente"}
              </span>
            </div>

            {group.savedCount === 0 ? (
              <div className="mt-4 rounded-card border border-border-subtle bg-background-secondary/70 px-4 py-4 text-sm text-text-secondary">
                No hay un orden guardado para este grupo.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {group.teams.map((team) => (
                  <div
                    key={`${group.groupLetter}-${team.predictedPosition}-${team.id ?? "empty"}`}
                    className="flex items-center justify-between gap-3 rounded-card border border-border-subtle bg-background-secondary/70 px-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface-card font-numeric text-sm font-bold text-text-primary">
                        {team.predictedPosition}
                      </div>
                      <TeamBadge
                        code={team.code ?? undefined}
                        flagUrl={team.flagUrl}
                        isPlaceholder={team.isTbd}
                        name={team.name}
                      />
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-semibold text-text-primary">
                        {stampLabel(team)}
                      </p>
                      <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-text-muted">
                        {team.actualPosition ? `Real ${team.actualPosition}` : "Sin cierre"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 rounded-card border border-border-subtle bg-background-secondary/60 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
                Total del grupo
              </p>
              <p className="mt-1 font-numeric text-2xl font-bold text-text-primary">
                {group.totalPoints ?? "-"}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
