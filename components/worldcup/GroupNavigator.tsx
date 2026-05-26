"use client";

import { useEffect, useRef, useState } from "react";

import type { GroupLetter } from "@/lib/types/worldcup";
import { cn } from "@/lib/utils";

interface GroupNavigatorGroup {
  isEmpty?: boolean;
  isLocked?: boolean;
  letter: GroupLetter;
}

interface GroupNavigatorProps {
  groups: GroupNavigatorGroup[];
  initialActiveLetter?: GroupLetter | null;
}

const groupBorderStyles: Record<GroupLetter, string> = {
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

const groupTextStyles: Record<GroupLetter, string> = {
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

function toSectionId(letter: GroupLetter) {
  return `grupo-${letter.toLowerCase()}`;
}

export function GroupNavigator({
  groups,
  initialActiveLetter = null,
}: GroupNavigatorProps) {
  const [activeLetter, setActiveLetter] = useState<GroupLetter | null>(initialActiveLetter);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    const sections = groups
      .map((group) => {
        const element = document.getElementById(toSectionId(group.letter));

        return element
          ? {
              element,
              letter: group.letter,
            }
          : null;
      })
      .filter((section): section is { element: HTMLElement; letter: GroupLetter } => section !== null);

    if (sections.length === 0) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

        const nextId = visibleEntries[0]?.target.id;

        if (!nextId) {
          return;
        }

        if (debounceRef.current) {
          window.clearTimeout(debounceRef.current);
        }

        debounceRef.current = window.setTimeout(() => {
          setActiveLetter(nextId.replace("grupo-", "").toUpperCase() as GroupLetter);
        }, 90);
      },
      {
        root: null,
        rootMargin: "-96px 0px -40% 0px",
        threshold: [0.2, 0.4, 0.6, 0.8],
      },
    );

    sections.forEach((section) => observer.observe(section.element));

    return () => {
      observer.disconnect();

      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [groups]);

  return (
    <div
      className="sticky top-4 z-20 -mx-1 overflow-x-auto rounded-card border border-border-subtle bg-background-main/88 px-1 py-1 shadow-card backdrop-blur-xl"
      data-testid="group-navigator"
    >
      <div className="flex min-w-max items-center gap-2">
        {groups.map((group) => {
          const isActive = activeLetter === group.letter;

          return (
            <button
              key={group.letter}
              aria-current={isActive ? "true" : undefined}
              aria-label={`Ir al grupo ${group.letter}`}
              className={cn(
                "inline-flex h-10 min-w-10 items-center justify-center rounded-pill border px-3 text-sm font-semibold transition duration-200 active:scale-[0.98]",
                group.isEmpty
                  ? "border-border-subtle text-text-disabled opacity-60"
                  : cn(
                      "bg-surface-card/85",
                      groupBorderStyles[group.letter],
                      groupTextStyles[group.letter],
                    ),
                group.isLocked ? "opacity-70 saturate-75" : null,
                isActive
                  ? "border-accent-primary bg-accent-primary/10 text-accent-primary shadow-glowCyan ring-1 ring-accent-primary/45"
                  : "hover:border-accent-primary/35 hover:text-text-primary",
              )}
              data-group-nav-chip={group.letter}
              onClick={() => {
                setActiveLetter(group.letter);
                document.getElementById(toSectionId(group.letter))?.scrollIntoView({
                  behavior: "smooth",
                  block: "start",
                });
              }}
              type="button"
            >
              {group.letter}
            </button>
          );
        })}
      </div>
    </div>
  );
}
