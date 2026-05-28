"use client";

import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import type { GroupPredictionTeamViewModel } from "@/lib/types/worldcup";
import { cn } from "@/lib/utils";

import { TeamBadge } from "./TeamBadge";

interface GroupTableProps {
  isLocked: boolean;
  onMoveDown?: (teamId: string) => void;
  onReorder?: (activeTeamId: string, targetTeamId: string) => void;
  onMoveUp?: (teamId: string) => void;
  teams: GroupPredictionTeamViewModel[];
}

export function GroupTable({
  isLocked,
  onMoveDown,
  onReorder,
  onMoveUp,
  teams,
}: GroupTableProps) {
  const [draggedTeamId, setDraggedTeamId] = useState<string | null>(null);
  const draggedTeamIdRef = useRef<string | null>(null);
  const activePointerIdRef = useRef<number | null>(null);
  const lastTargetTeamIdRef = useRef<string | null>(null);

  function resetDragState() {
    activePointerIdRef.current = null;
    draggedTeamIdRef.current = null;
    lastTargetTeamIdRef.current = null;
    setDraggedTeamId(null);
    document.body.style.userSelect = "";
    document.body.style.touchAction = "";
  }

  useEffect(() => resetDragState, []);

  useEffect(() => {
    if (!draggedTeamId || isLocked) {
      return;
    }

    function handlePointerMove(event: PointerEvent) {
      if (activePointerIdRef.current !== event.pointerId) {
        return;
      }

      const teamRow = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>("[data-team-id]");
      const targetTeamId = teamRow?.dataset.teamId ?? null;
      const activeTeamId = draggedTeamIdRef.current;

      if (
        !targetTeamId ||
        !activeTeamId ||
        targetTeamId === activeTeamId ||
        targetTeamId === lastTargetTeamIdRef.current
      ) {
        return;
      }

      lastTargetTeamIdRef.current = targetTeamId;
      onReorder?.(activeTeamId, targetTeamId);
    }

    function handlePointerEnd(event: PointerEvent) {
      if (activePointerIdRef.current !== event.pointerId) {
        return;
      }

      resetDragState();
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerEnd);
    window.addEventListener("pointercancel", handlePointerEnd);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerEnd);
      window.removeEventListener("pointercancel", handlePointerEnd);
    };
  }, [draggedTeamId, isLocked, onReorder]);

  return (
    <ol className="space-y-3">
      {teams.map((team, index) => {
        const isFirst = index === 0;
        const isLast = index === teams.length - 1;
        const isDragging = draggedTeamId === team.id;

        return (
          <li
            key={team.id}
            className={cn(
              "flex items-center gap-3 rounded-card border border-border-subtle bg-background-secondary/70 px-3 py-3 shadow-card transition duration-200 active:scale-[0.995]",
              isDragging &&
                "scale-[0.99] border-accent-secondary/35 bg-surface-active shadow-glowViolet",
            )}
            data-team-id={team.id}
          >
            <div className="flex w-8 shrink-0 items-center justify-center font-numeric text-lg font-bold text-text-primary">
              {index + 1}
            </div>

            <button
              aria-label={`Arrastra a ${team.name} a otra posición`}
              className={cn(
                "flex shrink-0 touch-none items-center justify-center rounded-pill border px-2 py-2 text-text-muted transition duration-200",
                isLocked
                  ? "cursor-not-allowed border-border-subtle bg-surface-card opacity-45"
                  : isDragging
                    ? "border-accent-secondary/35 bg-accent-secondary/10 text-accent-secondary shadow-glowViolet"
                    : "focus-ring border-border-subtle bg-surface-card hover:border-accent-secondary/35 hover:bg-surface-active hover:text-text-primary active:scale-[0.98]",
              )}
              disabled={isLocked}
              onPointerDown={(event) => {
                if (isLocked) {
                  return;
                }

                event.preventDefault();
                activePointerIdRef.current = event.pointerId;
                draggedTeamIdRef.current = team.id;
                lastTargetTeamIdRef.current = team.id;
                setDraggedTeamId(team.id);
                document.body.style.userSelect = "none";
                document.body.style.touchAction = "none";
              }}
              type="button"
            >
              <GripVertical className="size-4" strokeWidth={2} />
            </button>

            <div className="min-w-0 flex-1">
              <TeamBadge
                code={team.code}
                flagUrl={team.flagUrl}
                isPlaceholder={team.isTbd}
                name={team.name}
              />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                aria-label={`Subir a ${team.name}`}
                className={cn(
                  "focus-ring inline-flex size-10 items-center justify-center rounded-pill border border-border-subtle bg-surface-card text-text-secondary transition duration-200 active:scale-[0.98]",
                  !isLocked && !isFirst && "hover:border-accent-secondary/35 hover:bg-surface-active hover:text-text-primary",
                  (isLocked || isFirst) &&
                    "cursor-not-allowed opacity-45",
                )}
                disabled={isLocked || isFirst}
                onClick={() => onMoveUp?.(team.id)}
                type="button"
              >
                <ArrowUp className="size-4" strokeWidth={2} />
              </button>

              <button
                aria-label={`Bajar a ${team.name}`}
                className={cn(
                  "focus-ring inline-flex size-10 items-center justify-center rounded-pill border border-border-subtle bg-surface-card text-text-secondary transition duration-200 active:scale-[0.98]",
                  !isLocked && !isLast && "hover:border-accent-primary/35 hover:bg-surface-active hover:text-text-primary",
                  (isLocked || isLast) &&
                    "cursor-not-allowed opacity-45",
                )}
                disabled={isLocked || isLast}
                onClick={() => onMoveDown?.(team.id)}
                type="button"
              >
                <ArrowDown className="size-4" strokeWidth={2} />
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
