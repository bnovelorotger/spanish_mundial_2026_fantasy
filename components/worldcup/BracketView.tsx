import { StateCard } from "@/components/ui/StateCard";
import type {
  BracketRoundViewModel,
  KnockoutWindowSummary,
} from "@/lib/types/worldcup";

import { LocalKickoff } from "./LocalKickoff";
import { BracketPredictionEditor } from "./BracketPredictionEditor";

interface BracketViewProps {
  activeMatchId?: string;
  error?: string | null;
  rounds: BracketRoundViewModel[];
  saveAction: (formData: FormData) => void | Promise<void>;
  saved?: boolean;
  windowSummary?: KnockoutWindowSummary | null;
}

export function BracketView({
  activeMatchId,
  error,
  rounds,
  saveAction,
  saved = false,
  windowSummary = null,
}: BracketViewProps) {
  return (
    <section className="space-y-4">
      <div className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-secondary">
          Cuadro de eliminatorias
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-text-primary">
          Rellena el bracket por ventanas y mantén viva la carrera.
        </h2>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          El cuadro se completa por lados del bracket, con dos ventanas fijas:
          primero dieciseisavos y octavos, después cuartos, semifinales y final.
        </p>

        {windowSummary?.effectiveLockAt ? (
          <div className="mt-5 rounded-card border border-accent-primary/20 bg-accent-primary/10 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary">
              {windowSummary.label}
            </p>
            <p className="mt-1 text-sm font-semibold text-text-primary">
              {windowSummary.roundsLabel}
            </p>
            <p className="mt-1 text-sm text-text-secondary">
              Cierra en{" "}
              <LocalKickoff isoUtc={windowSummary.effectiveLockAt} separator=" · " />
              .
            </p>
          </div>
        ) : null}
      </div>

      <div className="overflow-x-auto pb-2" data-tour="knockout-board">
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
                  round.matches.map((match, matchIndex) => (
                    <BracketPredictionEditor
                      key={match.id}
                      dataTourCard={matchIndex === 0 ? "knockout-match" : undefined}
                      dataTourState={matchIndex === 0 ? "knockout-state" : undefined}
                      flash={
                        activeMatchId === match.id
                          ? error
                            ? {
                                message: error,
                                tone: "error" as const,
                              }
                            : saved
                              ? {
                                  message: "Guardado. Tu lado ya quedó fijado en el cuadro.",
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
                    description="Los cruces de esta fase aparecerán en cuanto el sorteo los confirme."
                    eyebrow="Sin cruces aún"
                    title="Esta ronda espera su primera tarjeta."
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
