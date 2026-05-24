import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";

import type { GroupPredictionTeamViewModel } from "@/lib/types/worldcup";
import { cn } from "@/lib/utils";

import { TeamBadge } from "./TeamBadge";

interface GroupTableProps {
  isLocked: boolean;
  onMoveDown?: (teamId: string) => void;
  onMoveUp?: (teamId: string) => void;
  teams: GroupPredictionTeamViewModel[];
}

export function GroupTable({
  isLocked,
  onMoveDown,
  onMoveUp,
  teams,
}: GroupTableProps) {
  return (
    <ol className="space-y-3">
      {teams.map((team, index) => {
        const isFirst = index === 0;
        const isLast = index === teams.length - 1;

        return (
          <li
            key={team.id}
            className="flex items-center gap-3 rounded-card border border-border-subtle bg-background-secondary/70 px-3 py-3 shadow-card transition-transform duration-200 active:scale-[0.995]"
          >
            <div className="flex w-8 shrink-0 items-center justify-center font-numeric text-lg font-bold text-text-primary">
              {index + 1}
            </div>

            <div className="flex shrink-0 items-center justify-center text-text-muted">
              <GripVertical className="size-4" strokeWidth={2} />
            </div>

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
                aria-label={`Move ${team.name} up`}
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-pill border border-border-subtle bg-surface-card text-text-secondary transition duration-200 active:scale-[0.98]",
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
                aria-label={`Move ${team.name} down`}
                className={cn(
                  "inline-flex size-10 items-center justify-center rounded-pill border border-border-subtle bg-surface-card text-text-secondary transition duration-200 active:scale-[0.98]",
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
