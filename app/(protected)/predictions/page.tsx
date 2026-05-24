import { redirect } from "next/navigation";

import { GroupPredictionEditor } from "@/components/worldcup/GroupPredictionEditor";
import { getGroupPredictionGroups } from "@/lib/services/predictions.service";
import { createClient } from "@/lib/supabase/server";

import { saveGroupPredictionAction } from "./actions";

type PredictionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function PredictionsPage({
  searchParams,
}: PredictionsPageProps) {
  const params = (await searchParams) ?? {};
  const activeGroup = getQueryValue(params, "group");
  const error = getQueryValue(params, "error");
  const saved = getQueryValue(params, "saved") === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Sign%20in%20to%20make%20your%20picks.");
  }

  let groups: Awaited<ReturnType<typeof getGroupPredictionGroups>> | null;

  try {
    groups = await getGroupPredictionGroups(supabase, user.id);
  } catch {
    groups = null;
  }

  if (!groups) {
    return (
      <section className="rounded-cardLg border border-status-live/35 bg-surface-card/90 p-6 shadow-card">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-status-live">
          Prediction board offline
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-text-primary">
          Couldn&apos;t load group predictions.
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Try again in a moment. Your tournament board should be back under the
          lights shortly.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-accent-secondary">
          Group predictions
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-text-primary">
          Move every group into your exact 1-4 finish.
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Reorder four teams in each group, save the board with one tap, and
          beat the lock before the first group stage kickoff lands.
        </p>
      </div>

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
    </section>
  );
}
