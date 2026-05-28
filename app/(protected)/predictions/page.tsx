import Link from "next/link";
import { redirect } from "next/navigation";

import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { StateCard } from "@/components/ui/StateCard";
import { BracketView } from "@/components/worldcup/BracketView";
import { GroupPredictionEditor } from "@/components/worldcup/GroupPredictionEditor";
import { GroupNavigator } from "@/components/worldcup/GroupNavigator";
import { ONBOARDING_TOURS, type OnboardingTourId } from "@/lib/onboarding/tours";
import { getBracketRounds } from "@/lib/services/bracket.service";
import type { GroupLetter } from "@/lib/types/worldcup";
import { getGroupPredictionGroups } from "@/lib/services/predictions.service";
import { createClient } from "@/lib/supabase/server";

import {
  saveGroupPredictionAction,
  saveKnockoutPredictionAction,
} from "./actions";

type PredictionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type PredictionsTab = "groups" | "knockout";

function getQueryValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function resolveTab(value: string | undefined): PredictionsTab {
  return value === "knockout" ? "knockout" : "groups";
}

function resolveActiveGroup(value: string | undefined): GroupLetter | null {
  if (!value) {
    return null;
  }

  const nextValue = value.toUpperCase();

  return nextValue >= "A" && nextValue <= "L" ? (nextValue as GroupLetter) : null;
}

function PredictionTabLink({
  currentTab,
  label,
  tab,
}: {
  currentTab: PredictionsTab;
  label: string;
  tab: PredictionsTab;
}) {
  const isActive = currentTab === tab;

  return (
    <Link
      className={
        isActive
          ? "inline-flex h-11 items-center justify-center rounded-pill border border-accent-primary/35 bg-accent-primary/10 px-5 text-sm font-semibold text-accent-primary shadow-glowCyan"
          : "inline-flex h-11 items-center justify-center rounded-pill border border-border-subtle bg-surface-card px-5 text-sm font-semibold text-text-secondary transition-colors duration-200 hover:bg-surface-active"
      }
      href={tab === "groups" ? "/predictions?tab=groups" : "/predictions?tab=knockout"}
    >
      {label}
    </Link>
  );
}

function PredictionsHeader({
  tab,
}: {
  tab: PredictionsTab;
}) {
  return (
    <div className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-secondary">
        Predicciones
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-text-primary">
        {tab === "groups"
          ? "Ordena cada grupo hasta clavar tu 1-4."
          : "Lee el cuadro ronda a ronda y deja cerrados tus ganadores."}
      </h1>
      <p className="mt-3 text-sm leading-6 text-text-secondary">
        {tab === "groups"
          ? "Reordena los cuatro equipos de cada grupo, guarda con un toque y adelántate al cierre antes del primer partido de la fase de grupos."
          : "El cuadro de eliminatorias sigue siendo legible en móvil, una ronda por columna, y solo deja elegir ganador cuando ya se conocen ambos equipos."}
      </p>

      <div className="mt-5 flex flex-wrap gap-2" data-tour="tabs">
        <PredictionTabLink currentTab={tab} label="Grupos" tab="groups" />
        <PredictionTabLink currentTab={tab} label="Eliminatorias" tab="knockout" />
      </div>
    </div>
  );
}

function PredictionsErrorState({
  title,
}: {
  title: string;
}) {
  return (
    <StateCard
      description="Prueba de nuevo en un momento. Tu tablero del torneo debería volver a encenderse enseguida."
      eyebrow="Predicciones fuera de juego"
      title={title}
      tone="error"
    />
  );
}

export default async function PredictionsPage({
  searchParams,
}: PredictionsPageProps) {
  const params = (await searchParams) ?? {};
  const activeGroup = getQueryValue(params, "group");
  const activeMatch = getQueryValue(params, "match");
  const activeTab = resolveTab(getQueryValue(params, "tab"));
  const error = getQueryValue(params, "error");
  const saved = getQueryValue(params, "saved") === "1";
  const initialActiveGroup = resolveActiveGroup(activeGroup);
  const onboardingTourId: OnboardingTourId =
    activeTab === "knockout" ? "predictions-knockout" : "predictions-groups";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Inicia%20sesión%20para%20hacer%20tus%20pronósticos.");
  }

  if (activeTab === "knockout") {
    let rounds: Awaited<ReturnType<typeof getBracketRounds>> | null;

    try {
      rounds = await getBracketRounds(supabase, user.id);
    } catch {
      rounds = null;
    }

    return (
      <OnboardingTour
        steps={ONBOARDING_TOURS[onboardingTourId]}
        tourId={onboardingTourId}
      >
        <section className="space-y-6">
          <PredictionsHeader tab="knockout" />

          {rounds ? (
            <BracketView
              activeMatchId={activeMatch}
              error={error}
              rounds={rounds}
              saveAction={saveKnockoutPredictionAction}
              saved={saved}
            />
          ) : (
            <PredictionsErrorState title="No hemos podido cargar las predicciones de eliminatorias." />
          )}
        </section>
      </OnboardingTour>
    );
  }

  let groups: Awaited<ReturnType<typeof getGroupPredictionGroups>> | null;

  try {
    groups = await getGroupPredictionGroups(supabase, user.id);
  } catch {
    groups = null;
  }

  return (
    <OnboardingTour
      steps={ONBOARDING_TOURS[onboardingTourId]}
      tourId={onboardingTourId}
    >
      <section className="space-y-6">
        <PredictionsHeader tab="groups" />

        {groups ? (
          <div className="space-y-4">
            <GroupNavigator
              groups={groups.map((group) => ({
                isEmpty: group.teams.length === 0,
                isLocked: group.lock.isLocked,
                letter: group.groupLetter,
              }))}
              initialActiveLetter={initialActiveGroup}
            />

            <div className="grid gap-4 xl:grid-cols-2">
              {groups.map((group) => (
                <GroupPredictionEditor
                  key={`${group.groupLetter}-${group.teams.map((team) => team.id).join("-")}`}
                  flash={
                    activeGroup === group.groupLetter
                      ? error
                        ? {
                            message: error,
                            tone: "error" as const,
                          }
                        : saved
                          ? {
                              message: "Guardado. El orden de tu grupo ya vuelve a estar en juego.",
                              tone: "success" as const,
                            }
                          : null
                      : null
                  }
                  group={group}
                  saveAction={saveGroupPredictionAction}
                />
              ))}
            </div>
          </div>
        ) : (
          <PredictionsErrorState title="No hemos podido cargar las predicciones de grupos." />
        )}
      </section>
    </OnboardingTour>
  );
}
