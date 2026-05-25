import { StateCard } from "@/components/ui/StateCard";
import type { BracketRoundViewModel } from "@/lib/types/worldcup";

import { BracketPredictionEditor } from "./BracketPredictionEditor";

interface BracketViewProps {
  activeMatchId?: string;
  error?: string | null;
  rounds: BracketRoundViewModel[];
  saveAction: (formData: FormData) => void | Promise<void>;
  saved?: boolean;
}

export function BracketView({
  activeMatchId,
  error,
  rounds,
  saveAction,
  saved = false,
}: BracketViewProps) {
  return (
    <section className="space-y-4">
      <div className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-secondary">
          Cuadro de eliminatorias
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-text-primary">
          Recorre las rondas, elige ganadores y mantén viva la carrera.
        </h2>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Una ronda por columna, pensado primero para móvil y sin una imagen
          gigante que esconda el cuadro en una pantalla de 360px.
        </p>
      </div>

      <div className="overflow-x-auto pb-2">
        <div className="flex min-w-max gap-4">
          {rounds.map((round) => (
            <section
              key={round.phase}
              className="w-[280px] shrink-0 rounded-cardLg border border-border-subtle bg-surface-card/80 p-4 shadow-card"
            >
              <div className="border-l-2 border-accent-secondary/35 pl-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-secondary">
                  {round.label}
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  {round.matches.length} partido{round.matches.length === 1 ? "" : "s"}
                </p>
              </div>

              <div className="mt-4 space-y-4">
                {round.matches.length > 0 ? (
                  round.matches.map((match) => (
                    <BracketPredictionEditor
                      key={match.id}
                      flash={
                        activeMatchId === match.id
                          ? error
                            ? {
                                message: error,
                                tone: "error" as const,
                              }
                            : saved
                              ? {
                                  message: "Guardado. Tu ganador ya está en el cuadro.",
                                  tone: "success" as const,
                                }
                              : null
                          : null
                      }
                      match={match}
                      saveAction={saveAction}
                    />
                  ))
                ) : (
                  <StateCard
                    description="Esta columna ya está preparada. Los cruces de eliminatorias aparecerán aquí en cuanto entren en Supabase."
                    eyebrow="Tu torneo empieza aquí."
                    title="Esta ronda del cuadro espera su primera tarjeta de partido."
                    tone="default"
                  />
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
