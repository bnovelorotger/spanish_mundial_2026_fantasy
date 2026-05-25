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
    redirect("/login?error=Inicia%20sesi%C3%B3n%20para%20actualizar%20tu%20perfil.");
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
      error: "Ese nombre de usuario ya está en uso. Elige otro distinto.",
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
      error: "No hemos podido guardar tu perfil. Inténtalo de nuevo.",
    });
  }

  revalidatePath("/profile");
  redirectToProfile({ success: "Perfil guardado." });
}
