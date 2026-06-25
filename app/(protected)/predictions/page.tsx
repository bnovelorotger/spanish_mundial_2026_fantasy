import Link from "next/link";
import { redirect } from "next/navigation";

import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { StateCard } from "@/components/ui/StateCard";
import { BracketView } from "@/components/worldcup/BracketView";
import { GroupPredictionEditor } from "@/components/worldcup/GroupPredictionEditor";
import { GroupNavigator } from "@/components/worldcup/GroupNavigator";
import { ONBOARDING_TOURS, type OnboardingTourId } from "@/lib/onboarding/tours";
import { getBracketRounds } from "@/lib/services/bracket.service";
import {
  getCurrentKnockoutWindowSummary,
} from "@/lib/services/knockout-window.service";
import { getPhaseLock } from "@/lib/services/locks.service";
import { getGroupPredictionGroups } from "@/lib/services/predictions.service";
import { createClient } from "@/lib/supabase/server";
import type {
  GroupLetter,
  KnockoutWindowSummary,
} from "@/lib/types/worldcup";

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
          ? "focus-ring inline-flex h-11 items-center justify-center rounded-pill border border-accent-primary/35 bg-accent-primary/10 px-5 text-sm font-semibold text-accent-primary shadow-glowCyan"
          : "focus-ring inline-flex h-11 items-center justify-center rounded-pill border border-border-subtle bg-surface-card px-5 text-sm font-semibold text-text-secondary transition-colors duration-200 hover:bg-surface-active"
      }
      href={tab === "groups" ? "/predictions?tab=groups" : "/predictions?tab=knockout"}
    >
      {label}
    </Link>
  );
}

function PredictionsHeader({
  knockoutWindowSummary,
  tab,
}: {
  knockoutWindowSummary?: KnockoutWindowSummary | null;
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
          : "Rellena el bracket por ventanas y fija el lado que avanza."}
      </h1>
      <p className="mt-3 text-sm leading-6 text-text-secondary">
        {tab === "groups"
          ? "Reordena los cuatro equipos de cada grupo, guarda con un toque y adelántate al cierre antes del primer partido de la fase de grupos."
          : "El cuadro de eliminatorias se juega en dos ventanas: primero dieciseisavos y octavos; después cuartos, semifinales y final."}
      </p>

      {tab === "knockout" && knockoutWindowSummary?.effectiveLockAt ? (
        <div className="mt-4 rounded-card border border-accent-primary/25 bg-accent-primary/10 px-4 py-3 text-sm text-text-secondary">
          <p className="font-semibold uppercase tracking-[0.18em] text-accent-primary">
            {knockoutWindowSummary.label}
          </p>
          <p className="mt-1 text-text-primary">
            {knockoutWindowSummary.roundsLabel}
          </p>
          <p className="mt-1">{knockoutWindowSummary.description}</p>
        </div>
      ) : null}

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
      description="Inténtalo en un momento. Tu tablero del torneo sigue ahí."
      eyebrow="Predicciones offline"
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
    let knockoutWindowSummary: KnockoutWindowSummary | null;

    try {
      const [resolvedRounds, stageOneLock, stageTwoLock] = await Promise.all([
        getBracketRounds(supabase, user.id),
        getPhaseLock(supabase, "KNOCKOUT_STAGE_ONE"),
        getPhaseLock(supabase, "KNOCKOUT_STAGE_TWO"),
      ]);
      rounds = resolvedRounds;
      knockoutWindowSummary = getCurrentKnockoutWindowSummary({
        stageOne: stageOneLock,
        stageTwo: stageTwoLock,
      });
    } catch (caughtError) {
      console.error(
        "[predictions/page] Failed to load knockout predictions page",
        caughtError,
      );
      rounds = null;
      knockoutWindowSummary = null;
    }

    return (
      <OnboardingTour
        steps={ONBOARDING_TOURS[onboardingTourId]}
        tourId={onboardingTourId}
      >
        <section className="space-y-6">
          <PredictionsHeader
            knockoutWindowSummary={knockoutWindowSummary}
            tab="knockout"
          />

          {rounds ? (
            <BracketView
              activeMatchId={activeMatch}
              error={error}
              rounds={rounds}
              saveAction={saveKnockoutPredictionAction}
              saved={saved}
              windowSummary={knockoutWindowSummary}
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
