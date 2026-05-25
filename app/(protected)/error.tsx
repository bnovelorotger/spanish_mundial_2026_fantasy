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
      description="Tu torneo privado volverá a estar en marcha en un momento. Prueba otra vez enseguida."
      eyebrow="Pantalla protegida fuera de juego"
      title="No hemos podido cargar esta pantalla."
      tone="error"
    />
  );
}
