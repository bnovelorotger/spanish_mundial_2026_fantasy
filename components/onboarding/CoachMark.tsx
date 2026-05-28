"use client";

import * as Popover from "@radix-ui/react-popover";

import { cn } from "@/lib/utils";

interface CoachMarkProps {
  anchorRect: DOMRect;
  currentStep: number;
  description: string;
  onNext: () => void;
  onOpenChange: (open: boolean) => void;
  onSkip?: () => void;
  open: boolean;
  side: "bottom" | "top";
  title: string;
  totalSteps: number;
}

export function CoachMark({
  anchorRect,
  currentStep,
  description,
  onNext,
  onOpenChange,
  onSkip,
  open,
  side,
  title,
  totalSteps,
}: CoachMarkProps) {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <Popover.Root modal={false} open={open} onOpenChange={onOpenChange}>
      <Popover.Anchor asChild>
        <span
          className="pointer-events-none fixed z-40 block h-px w-px"
          style={{
            left: anchorRect.left + anchorRect.width / 2,
            top: anchorRect.top + anchorRect.height / 2,
          }}
        />
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          align="center"
          className={cn(
            "z-50 w-[min(320px,calc(100vw-32px))] rounded-card border border-border-subtle bg-surface-elevated p-4 text-text-primary shadow-card outline-none transition duration-200 data-[state=closed]:translate-y-1 data-[state=closed]:opacity-0 data-[state=open]:translate-y-0 data-[state=open]:opacity-100",
          )}
          collisionPadding={{
            bottom: 96,
            left: 16,
            right: 16,
            top: 16,
          }}
          onEscapeKeyDown={() => onOpenChange(false)}
          side={side}
          sideOffset={16}
        >
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary">
              {currentStep + 1} de {totalSteps}
            </p>
            <div>
              <h3 className="text-base font-semibold text-text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{description}</p>
            </div>
            <div className="flex items-center justify-between gap-3">
              {currentStep === 0 && onSkip ? (
                <button
                  className="text-sm font-medium text-text-muted transition-colors duration-150 hover:text-text-primary"
                  onClick={onSkip}
                  type="button"
                >
                  Saltar
                </button>
              ) : (
                <span />
              )}
              <button
                className="inline-flex h-11 items-center justify-center rounded-pill bg-linear-to-r from-accent-primary to-accent-secondary px-5 text-sm font-semibold text-background-main shadow-glowCyan transition-transform duration-150 active:scale-[0.97]"
                onClick={onNext}
                type="button"
              >
                {isLastStep ? "Hecho" : "Siguiente"}
              </button>
            </div>
          </div>
          <Popover.Arrow className="fill-surface-elevated stroke-border-subtle" height={10} width={18} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
