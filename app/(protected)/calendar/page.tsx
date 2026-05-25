import Link from "next/link";

import { StateCard } from "@/components/ui/StateCard";
import { MatchCard } from "@/components/worldcup/MatchCard";
import { createClient } from "@/lib/supabase/server";
import {
  getMatches,
  normalizeMatchFilters,
} from "@/lib/services/matches.service";
import {
  GROUP_LETTER_OPTIONS,
  MATCH_PHASE_OPTIONS,
  type MatchFilters,
  type MatchPhase,
} from "@/lib/types/worldcup";

type CalendarPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const phaseLabels: Record<MatchPhase, string> = {
  FINAL: "Final",
  GROUP_STAGE: "Fase de grupos",
  QUARTER_FINALS: "Cuartos de final",
  ROUND_OF_16: "Octavos de final",
  ROUND_OF_32: "Dieciseisavos de final",
  SEMI_FINALS: "Semifinales",
  THIRD_PLACE: "Tercer puesto",
};

function getQueryValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function FilterLink({
  activeValue,
  currentFilters,
  label,
  nextValue,
  param,
}: {
  activeValue: string;
  currentFilters: MatchFilters;
  label: string;
  nextValue: string;
  param: "group" | "phase";
}) {
  const params = new URLSearchParams();

  const nextFilters = {
    ...currentFilters,
    [param]: nextValue,
  };

  if (nextFilters.phase && nextFilters.phase !== "ALL") {
    params.set("phase", nextFilters.phase);
  }

  if (nextFilters.group && nextFilters.group !== "ALL") {
    params.set("group", nextFilters.group);
  }

  const href = params.size > 0 ? `/matches?${params.toString()}` : "/matches";

  return (
    <Link
      className={
        activeValue === nextValue
          ? "inline-flex h-10 items-center justify-center rounded-pill border border-accent-primary/35 bg-accent-primary/10 px-4 text-sm font-semibold text-accent-primary shadow-glowCyan"
          : "inline-flex h-10 items-center justify-center rounded-pill border border-border-subtle bg-surface-card px-4 text-sm font-semibold text-text-secondary transition-colors duration-200 hover:bg-surface-active"
      }
      href={href}
    >
      {label}
    </Link>
  );
}

export default async function CalendarPage({
  searchParams,
}: CalendarPageProps) {
  const params = (await searchParams) ?? {};
  const filters = normalizeMatchFilters({
    group: getQueryValue(params, "group"),
    phase: getQueryValue(params, "phase"),
  });

  const supabase = await createClient();
  const matches = await getMatches(supabase, filters);

  return (
    <section className="space-y-6">
      <div className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-primary">
          Partidos
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-text-primary">
          Todos los cruces, uno a uno, con marcador pensado para móvil.
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Sigue horarios, sedes, estados en directo y contexto de grupos
          directamente desde Supabase sin salir del torneo.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
              Fase
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterLink
                activeValue={filters.phase ?? "ALL"}
                currentFilters={filters}
                label="Todas las fases"
                nextValue="ALL"
                param="phase"
              />
              {MATCH_PHASE_OPTIONS.map((phase) => (
                <FilterLink
                  key={phase}
                  activeValue={filters.phase ?? "ALL"}
                  currentFilters={filters}
                  label={phaseLabels[phase]}
                  nextValue={phase}
                  param="phase"
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
              Grupo
            </p>
            <div className="flex flex-wrap gap-2">
              <FilterLink
                activeValue={filters.group ?? "ALL"}
                currentFilters={filters}
                label="Todos los grupos"
                nextValue="ALL"
                param="group"
              />
              {GROUP_LETTER_OPTIONS.map((group) => (
                <FilterLink
                  key={group}
                  activeValue={filters.group ?? "ALL"}
                  currentFilters={filters}
                  label={`Grupo ${group}`}
                  nextValue={group}
                  param="group"
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {matches.length > 0 ? (
        <div className="grid gap-4">
          {matches.map((match, index) => (
            <MatchCard
              key={match.id}
              match={match}
              variant={index === 0 ? "premium" : "compact"}
            />
          ))}
        </div>
      ) : (
        <StateCard
          description="Prueba con otra fase o grupo y vuelve cuando se sincronicen más partidos en el calendario."
          eyebrow="Tu torneo empieza aquí."
          title="Todavía no hay partidos para este filtro."
          tone="default"
        />
      )}
    </section>
  );
}
