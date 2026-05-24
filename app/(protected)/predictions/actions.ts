"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  parseKnockoutPredictionFormData,
  saveKnockoutPrediction,
} from "@/lib/services/bracket.service";
import { ensureProfileForUser } from "@/lib/services/profile.service";
import {
  parseGroupPredictionFormData,
  saveGroupPrediction,
} from "@/lib/services/predictions.service";
import { createClient } from "@/lib/supabase/server";

function redirectToPredictions(params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);
  redirect(`/predictions?${searchParams.toString()}`);
}

function toSafePredictionErrorMessage(error: unknown) {
  if (!(error instanceof Error)) {
    return "We couldn't save your picks. Try again.";
  }

  if (error.message.startsWith("Could not")) {
    return "We couldn't save your picks. Try again.";
  }

  return error.message;
}

export async function saveGroupPredictionAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Sign%20in%20to%20save%20your%20picks.");
  }

  await ensureProfileForUser(user);

  const parsed = parseGroupPredictionFormData(formData);
  const groupLetter =
    parsed.data?.groupLetter ?? String(formData.get("group_letter") ?? "A");

  if (!parsed.data) {
    redirectToPredictions({
      error: parsed.error,
      group: groupLetter,
      tab: "groups",
    });
  }

  const parsedData = parsed.data;

  try {
    await saveGroupPrediction(supabase, user.id, parsedData);
  } catch (error) {
    redirectToPredictions({
      error: toSafePredictionErrorMessage(error),
      group: parsedData.groupLetter,
      tab: "groups",
    });
  }

  revalidatePath("/predictions");
  redirectToPredictions({
    group: parsedData.groupLetter,
    saved: "1",
    tab: "groups",
  });
}

export async function saveKnockoutPredictionAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Sign%20in%20to%20save%20your%20knockout%20pick.");
  }

  await ensureProfileForUser(user);

  const parsed = parseKnockoutPredictionFormData(formData);
  const matchId = String(formData.get("match_id") ?? "").trim();

  if (!parsed.data) {
    redirectToPredictions({
      error: parsed.error,
      match: matchId,
      tab: "knockout",
    });
  }

  const parsedData = parsed.data;

  try {
    await saveKnockoutPrediction(supabase, user.id, parsedData);
  } catch (error) {
    redirectToPredictions({
      error: toSafePredictionErrorMessage(error),
      match: parsedData.matchId,
      tab: "knockout",
    });
  }

  revalidatePath("/predictions");
  redirectToPredictions({
    match: parsedData.matchId,
    saved: "1",
    tab: "knockout",
  });
}
