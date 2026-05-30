"use client";

import { StateCard } from "@/components/ui/StateCard";

export default function LoginError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10 sm:px-6">
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
        description="Refresca la página y vuelve a intentarlo."
        eyebrow="Acceso interrumpido"
        title="El acceso se ha tropezado un instante."
        tone="error"
      />
    </main>
  );
}
