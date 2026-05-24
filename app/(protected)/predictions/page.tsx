import Link from "next/link";
import { redirect } from "next/navigation";

import { StateCard } from "@/components/ui/StateCard";
import { BracketView } from "@/components/worldcup/BracketView";
import { GroupPredictionEditor } from "@/components/worldcup/GroupPredictionEditor";
import { getBracketRounds } from "@/lib/services/bracket.service";
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
        Predictions board
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-text-primary">
        {tab === "groups"
          ? "Move every group into your exact 1-4 finish."
          : "Read the bracket column by column and lock in your winners."}
      </h1>
      <p className="mt-3 text-sm leading-6 text-text-secondary">
        {tab === "groups"
          ? "Reorder four teams in each group, save the board with one tap, and beat the lock before the first group stage kickoff lands."
          : "The knockout bracket stays readable on mobile, one round per column, with safe winner picks only when both teams are known."}
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <PredictionTabLink currentTab={tab} label="Groups" tab="groups" />
        <PredictionTabLink currentTab={tab} label="Knockout" tab="knockout" />
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
      description="Try again in a moment. Your tournament board should be back under the lights shortly."
      eyebrow="Prediction board offline"
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Sign%20in%20to%20make%20your%20picks.");
  }

  if (activeTab === "knockout") {
    let rounds: Awaited<ReturnType<typeof getBracketRounds>> | null;

    try {
      rounds = await getBracketRounds(supabase, user.id);
    } catch {
      rounds = null;
    }

    return (
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
          <PredictionsErrorState title="Couldn't load knockout predictions." />
        )}
      </section>
    );
  }

  let groups: Awaited<ReturnType<typeof getGroupPredictionGroups>> | null;

  try {
    groups = await getGroupPredictionGroups(supabase, user.id);
  } catch {
    groups = null;
  }

  return (
    <section className="space-y-6">
      <PredictionsHeader tab="groups" />

      {groups ? (
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
                          message: "Saved. Your group order is back on the board.",
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
      ) : (
        <PredictionsErrorState title="Couldn't load group predictions." />
      )}
    </section>
  );
}
