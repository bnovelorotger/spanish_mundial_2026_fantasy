"use client";

import { StateCard } from "@/components/ui/StateCard";

export default function ProtectedError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <StateCard
      action={
        <button
          className="inline-flex h-11 items-center justify-center rounded-pill border border-border-subtle bg-surface-elevated px-5 text-sm font-semibold text-text-primary transition-colors duration-200 hover:bg-surface-active"
          onClick={() => reset()}
          type="button"
        >
          Reintentar
        </button>
      }
      description="Inténtalo en un momento. Tu liga sigue ahí, esperándote."
      eyebrow="Vista offline"
      title="No hemos podido cargar esta pantalla."
      tone="error"
    />
  );
}
