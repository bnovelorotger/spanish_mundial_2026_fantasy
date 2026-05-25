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
            Volver a cargar el acceso
          </button>
        }
        description="Vuelve a intentarlo en un momento. La entrada al torneo debería volver a encenderse enseguida."
        eyebrow="Acceso fuera de juego"
        title="No hemos podido cargar la pantalla de inicio de sesión."
        tone="error"
      />
    </main>
  );
}
