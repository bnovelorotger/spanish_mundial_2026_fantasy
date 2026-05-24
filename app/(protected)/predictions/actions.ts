"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
    });
  }

  const parsedData = parsed.data;

  try {
    await saveGroupPrediction(supabase, user.id, parsedData);
  } catch (error) {
    redirectToPredictions({
      error: toSafePredictionErrorMessage(error),
      group: parsedData.groupLetter,
    });
  }

  revalidatePath("/predictions");
  redirectToPredictions({
    group: parsedData.groupLetter,
    saved: "1",
  });
}
