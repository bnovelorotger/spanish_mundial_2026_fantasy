"use client";

import { AlertCircle, Check, Clock3, Lock } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import type {
  GroupPredictionGroupViewModel,
  GroupPredictionTeamViewModel,
  PredictionState,
} from "@/lib/types/worldcup";
import {
  formatKickoff,
  SERVER_TIME_ZONE_FALLBACK,
} from "@/lib/utils/datetime";
import { resolvePredictionState } from "@/lib/utils/locks";
import { cn } from "@/lib/utils";

import { GroupTable } from "./GroupTable";
import { PhaseBadge } from "./PhaseBadge";

interface GroupPredictionEditorProps {
  flash?: {
    message: string;
    tone: "error" | "success";
  } | null;
  group: GroupPredictionGroupViewModel;
  saveAction: (formData: FormData) => void | Promise<void>;
}

const groupAccentStyles: Record<GroupPredictionGroupViewModel["groupLetter"], string> =
  {
    A: "border-t-group-a",
    B: "border-t-group-b",
    C: "border-t-group-c",
    D: "border-t-group-d",
    E: "border-t-group-e",
    F: "border-t-group-f",
    G: "border-t-group-g",
    H: "border-t-group-h",
    I: "border-t-group-i",
    J: "border-t-group-j",
    K: "border-t-group-k",
    L: "border-t-group-l",
  };

const groupTextStyles: Record<GroupPredictionGroupViewModel["groupLetter"], string> = {
  A: "text-group-a",
  B: "text-group-b",
  C: "text-group-c",
  D: "text-group-d",
  E: "text-group-e",
  F: "text-group-f",
  G: "text-group-g",
  H: "text-group-h",
  I: "text-group-i",
  J: "text-group-j",
  K: "text-group-k",
  L: "text-group-l",
};

function badgeForState(state: PredictionState) {
  switch (state) {
    case "COMPLETED":
      return { label: "Completado", variant: "saved" as const };
    case "LOCKED":
      return { label: "Cerrado", variant: "locked" as const };
    case "PENDING":
      return { label: "Pendiente", variant: "pending" as const };
    default:
      return { label: "Editable", variant: "editable" as const };
  }
}

function arraysMatch(left: string[], right: string[]) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function moveTeam(
  teams: GroupPredictionTeamViewModel[],
  teamId: string,
  direction: -1 | 1,
) {
  const currentIndex = teams.findIndex((team) => team.id === teamId);
  const nextIndex = currentIndex + direction;

  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= teams.length) {
    return teams;
  }

  const nextTeams = [...teams];
  const currentTeam = nextTeams[currentIndex];

  nextTeams[currentIndex] = nextTeams[nextIndex];
  nextTeams[nextIndex] = currentTeam;

  return nextTeams.map((team, index) => ({
    ...team,
    predictedPosition: index + 1,
  }));
}

function reorderTeams(
  teams: GroupPredictionTeamViewModel[],
  activeTeamId: string,
  targetTeamId: string,
) {
  const fromIndex = teams.findIndex((team) => team.id === activeTeamId);
  const toIndex = teams.findIndex((team) => team.id === targetTeamId);

  if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
    return teams;
  }

  const nextTeams = [...teams];
  const [movedTeam] = nextTeams.splice(fromIndex, 1);

  if (!movedTeam) {
    return teams;
  }

  nextTeams.splice(toIndex, 0, movedTeam);

  return nextTeams.map((team, index) => ({
    ...team,
    predictedPosition: index + 1,
  }));
}

function formatLockCopy(lockAt: string | null) {
  if (!lockAt) {
    return "El orden de la fase de grupos seguirá abierto hasta el primer saque inicial.";
  }

  const kickoff = formatKickoff(lockAt, SERVER_TIME_ZONE_FALLBACK);

  return `Primer partido de la fase de grupos: ${kickoff.date} · ${kickoff.time}.`;
}

function SaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(
        "inline-flex h-12 items-center justify-center rounded-pill px-6 text-sm font-bold text-background-main shadow-glowCyan transition duration-200 active:scale-[0.98]",
        disabled || pending
          ? "cursor-not-allowed bg-surface-active text-text-disabled shadow-none"
          : "bg-linear-to-r from-accent-primary to-accent-secondary",
      )}
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? "Guardando pronóstico..." : "Guardar pronóstico"}
    </button>
  );
}

export function GroupPredictionEditor({
  flash,
  group,
  saveAction,
}: GroupPredictionEditorProps) {
  const [teams, setTeams] = useState(group.teams);

  const initialOrder = group.teams.map((team) => team.id);
  const currentOrder = teams.map((team) => team.id);
  const hasDirtyChanges = !arraysMatch(initialOrder, currentOrder);
  const state = resolvePredictionState({
    hasDirtyChanges,
    isLocked: group.lock.isLocked,
    savedCount: group.savedCount,
  });
  const badge = badgeForState(state);
  const canSave = !group.lock.isLocked && (hasDirtyChanges || group.savedCount < 4);

  return (
    <section
      className="scroll-mt-36 sm:scroll-mt-40"
      data-group-section={group.groupLetter}
      id={`grupo-${group.groupLetter.toLowerCase()}`}
    >
      <form
        action={saveAction}
        className={cn(
          "rounded-cardLg border border-border-subtle border-t-4 bg-surface-card/90 p-5 shadow-card",
          groupAccentStyles[group.groupLetter],
        )}
      >
        <input name="group_letter" type="hidden" value={group.groupLetter} />
        {teams.map((team) => (
          <input key={team.id} name="team_ids" type="hidden" value={team.id} />
        ))}

        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className={cn(
                "text-sm font-medium uppercase tracking-[0.18em]",
                groupTextStyles[group.groupLetter],
              )}
            >
              Grupo {group.groupLetter}
            </p>
            <h2 className="mt-2 text-lg font-semibold text-text-primary">
              Define tu 1-4 antes de que se cierre el tablero.
            </h2>
          </div>
          <PhaseBadge label={badge.label} variant={badge.variant} />
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-card border border-border-subtle bg-background-secondary/70 px-4 py-3 text-sm text-text-secondary">
          {group.lock.isLocked ? (
            <Lock className="mt-0.5 size-4 shrink-0 text-status-warning" strokeWidth={2} />
          ) : flash?.tone === "error" ? (
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-status-live" strokeWidth={2} />
          ) : flash?.tone === "success" ? (
            <Check className="mt-0.5 size-4 shrink-0 text-status-success" strokeWidth={2} />
          ) : (
            <Clock3 className="mt-0.5 size-4 shrink-0 text-accent-primary" strokeWidth={2} />
          )}
          <div className="space-y-1">
            <p className="font-medium text-text-primary">
              {group.lock.isLocked
                ? "La fase de grupos está cerrada. Tu orden guardado se mantiene en juego."
                : flash?.tone === "error"
                  ? "Ese guardado no ha llegado al tablero."
                  : state === "PENDING"
                    ? "Tienes cambios sin guardar en juego."
                    : state === "COMPLETED"
                      ? "Tu orden guardado ya está colocado en el tablero del torneo."
                      : "Está editable. Mueve los equipos hasta tu orden final previsto."}
            </p>
            <p
              className={cn(
                "text-sm",
                flash?.tone === "error" ? "text-status-live" : "text-text-muted",
              )}
            >
              {flash?.message ?? formatLockCopy(group.lock.effectiveLockAt)}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <GroupTable
            isLocked={group.lock.isLocked}
            onMoveDown={(teamId) => setTeams((currentTeams) => moveTeam(currentTeams, teamId, 1))}
            onMoveUp={(teamId) => setTeams((currentTeams) => moveTeam(currentTeams, teamId, -1))}
            onReorder={(activeTeamId, targetTeamId) =>
              setTeams((currentTeams) =>
                reorderTeams(currentTeams, activeTeamId, targetTeamId),
              )
            }
            teams={teams}
          />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
            {group.savedCount === 4 ? "Pronóstico guardado" : "Se necesitan cuatro equipos"}
          </p>
          <SaveButton disabled={!canSave} />
        </div>
      </form>
    </section>
  );
}
