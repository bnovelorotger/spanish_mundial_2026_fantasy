import { cn } from "@/lib/utils";

interface ScreenSkeletonProps {
  accent?: "cyan" | "violet";
  cards?: number;
  title?: string;
}

function SkeletonLine({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-3 animate-pulse rounded-pill bg-background-secondary",
        className,
      )}
    />
  );
}

export function ScreenSkeleton({
  accent = "cyan",
  cards = 3,
  title = "Cargando tu tablero del torneo.",
}: ScreenSkeletonProps) {
  const accentClass =
    accent === "violet"
      ? "border-accent-secondary/30 shadow-glowViolet"
      : "border-accent-primary/30 shadow-glowCyan";

  return (
    <section
      aria-label={title}
      className="space-y-4"
      role="status"
    >
      <div
        className={cn(
          "rounded-cardLg border bg-surface-card/90 p-5 shadow-card",
          accentClass,
        )}
      >
        <SkeletonLine className="w-28" />
        <SkeletonLine className="mt-4 h-7 w-3/4 rounded-card" />
        <SkeletonLine className="mt-3 w-full" />
        <SkeletonLine className="mt-2 w-5/6" />
      </div>

      <div className="grid gap-4">
        {Array.from({ length: cards }).map((_, index) => (
          <div
            key={`skeleton-card-${index}`}
            className="rounded-cardLg border border-border-subtle bg-surface-card/80 p-5 shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="w-full">
                <SkeletonLine className="w-20" />
                <SkeletonLine className="mt-4 h-6 w-2/3 rounded-card" />
              </div>
              <div className="size-10 animate-pulse rounded-full bg-background-secondary" />
            </div>
            <div className="mt-5 space-y-3">
              <SkeletonLine className="w-full" />
              <SkeletonLine className="w-11/12" />
              <SkeletonLine className="w-9/12" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
