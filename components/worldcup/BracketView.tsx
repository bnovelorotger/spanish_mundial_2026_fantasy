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
          Knockout bracket
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-text-primary">
          Scroll the rounds, pick winners, keep the race moving.
        </h2>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          One round per column, mobile-first by default, and no giant static image hiding the bracket from a 360px screen.
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
                  {round.matches.length} match{round.matches.length === 1 ? "" : "es"}
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
                                  message: "Saved. Your winner is now on the bracket board.",
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
                  <div className="rounded-card border border-border-subtle bg-background-secondary/70 p-4">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-primary">
                      Your tournament starts here.
                    </p>
                    <p className="mt-2 text-sm leading-6 text-text-secondary">
                      This round column is ready. Knockout fixtures appear here as soon as they land in Supabase.
                    </p>
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
