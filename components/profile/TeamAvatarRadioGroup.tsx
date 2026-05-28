"use client";

import * as RadioGroup from "@radix-ui/react-radio-group";
import Image from "next/image";
import { useRef, useState } from "react";

import { cn } from "@/lib/utils";

interface TeamAvatarOption {
  code: string;
  flagUrl: string | null;
  name: string;
}

interface TeamAvatarRadioGroupProps {
  chooseAction: (formData: FormData) => void | Promise<void>;
  selectedCode: string | null;
  teams: TeamAvatarOption[];
}

export function TeamAvatarRadioGroup({
  chooseAction,
  selectedCode,
  teams,
}: TeamAvatarRadioGroupProps) {
  const [value, setValue] = useState<string | undefined>(selectedCode ?? undefined);
  const formRef = useRef<HTMLFormElement | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  function applySelection(nextValue: string) {
    if (!nextValue || nextValue === value) {
      return;
    }

    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = nextValue;
    }

    setValue(nextValue);
    queueMicrotask(() => {
      formRef.current?.requestSubmit();
    });
  }

  return (
    <form action={chooseAction} ref={formRef}>
      <input
        name="team_code"
        readOnly
        ref={hiddenInputRef}
        type="hidden"
        value={value ?? ""}
      />
      <RadioGroup.Root
        aria-label="Elige el escudo de tu equipo favorito"
        className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8"
        onValueChange={applySelection}
        value={value}
      >
        {teams.map((team, index) => {
          const isSelected = value === team.code;

          return (
            <RadioGroup.Item
              aria-label={team.name}
              className={cn(
                "focus-ring flex w-full flex-col items-center gap-2 rounded-card border px-3 py-3 text-center transition-colors duration-200",
                isSelected
                  ? "border-accent-primary/40 bg-accent-primary/10 shadow-glowCyan"
                  : "border-border-subtle bg-background-secondary/70 hover:bg-surface-active",
              )}
              key={team.code}
              onClick={() => applySelection(team.code)}
              onKeyDown={(event) => {
                const moveBy =
                  event.key === "ArrowRight" || event.key === "ArrowDown"
                    ? 1
                    : event.key === "ArrowLeft" || event.key === "ArrowUp"
                      ? -1
                      : 0;

                if (moveBy === 0) {
                  return;
                }

                event.preventDefault();

                const nextIndex = (index + moveBy + teams.length) % teams.length;
                const nextTeam = teams[nextIndex];

                if (!nextTeam) {
                  return;
                }

                itemRefs.current[nextTeam.code]?.focus();
                applySelection(nextTeam.code);
              }}
              ref={(node) => {
                itemRefs.current[team.code] = node;
              }}
              tabIndex={isSelected || (!value && index === 0) ? 0 : -1}
              value={team.code}
            >
              {team.flagUrl ? (
                <Image
                  alt={`Escudo de ${team.name}`}
                  className="size-12 rounded-full border border-border-subtle object-cover"
                  height={48}
                  src={team.flagUrl}
                  width={48}
                />
              ) : (
                <div className="flex size-12 items-center justify-center rounded-full border border-accent-primary/30 bg-accent-primary/10 text-sm font-semibold uppercase tracking-[0.12em] text-accent-primary">
                  {team.code}
                </div>
              )}
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">
                {team.code}
              </span>
            </RadioGroup.Item>
          );
        })}
      </RadioGroup.Root>
    </form>
  );
}
