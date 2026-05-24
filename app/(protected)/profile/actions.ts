"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  ensureProfileForUser,
  usernameExistsForOtherUser,
  validateProfileFormData,
} from "@/lib/services/profile.service";
import { createClient } from "@/lib/supabase/server";

function redirectToProfile(params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);
  redirect(`/profile?${searchParams.toString()}`);
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Sign%20in%20to%20update%20your%20profile.");
  }

  await ensureProfileForUser(user);

  const validation = validateProfileFormData(
    String(formData.get("username") ?? ""),
    String(formData.get("display_name") ?? ""),
  );

  if (!validation.data) {
    redirectToProfile({ error: validation.error });
  }

  const profileData = validation.data;
  const usernameTaken = await usernameExistsForOtherUser(
    profileData.username,
    user.id,
  );

  if (usernameTaken) {
    redirectToProfile({
      error: "That username is already taken. Choose a different one.",
    });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: profileData.displayName,
      username: profileData.username,
    })
    .eq("id", user.id);

  if (error) {
    redirectToProfile({
      error: "We couldn't save your profile. Try again.",
    });
  }

  revalidatePath("/profile");
  redirectToProfile({ success: "Profile saved." });
}
