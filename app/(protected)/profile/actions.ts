"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  clearProfileAvatar,
  ensureProfileForUser,
  setProfileAvatarFromTeam,
  setProfileAvatarFromUpload,
  usernameExistsForOtherUser,
  validateProfileFormData,
} from "@/lib/services/profile.service";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function redirectToProfile(params: Record<string, string>): never {
  const searchParams = new URLSearchParams(params);
  redirect(`/profile?${searchParams.toString()}`);
}

function revalidateAvatarPaths() {
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/ranking");
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Inicia%20sesión%20para%20actualizar%20tu%20perfil.");
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

export async function uploadAvatarAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Inicia%20sesión%20para%20subir%20tu%20avatar.");
  }

  await ensureProfileForUser(user);

  const avatar = formData.get("avatar");

  if (!(avatar instanceof File) || avatar.size === 0) {
    redirectToProfile({
      avatar: "upload",
      error: "Selecciona una imagen antes de subirla.",
    });
  }

  const allowedTypes = new Map<string, string>([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
  ]);

  const extension = allowedTypes.get(avatar.type);

  if (!extension) {
    redirectToProfile({
      avatar: "upload",
      error: "Solo se permiten imágenes JPG, PNG o WEBP.",
    });
  }

  if (avatar.size > 2 * 1024 * 1024) {
    redirectToProfile({
      avatar: "upload",
      error: "La imagen no puede superar los 2 MB.",
    });
  }

  const storagePath = `${user.id}/avatar.${extension}`;

  // The authenticated server client built from cookies works fine for
  // PostgREST (the profiles table) but @supabase/ssr v0.10.x does not
  // reliably forward the user JWT to the Storage REST endpoint. That makes
  // the upload run as `anon`, which the RLS policies on storage.objects
  // reject. We use the admin client (service role) just for this hop —
  // RLS is bypassed but we control the path manually (`${user.id}/...`)
  // so a user cannot write outside their own folder.
  const admin = createAdminClient();
  const { error } = await admin.storage.from("avatars").upload(storagePath, avatar, {
    contentType: avatar.type,
    upsert: true,
  });

  if (error) {
    console.error("avatar upload failed", {
      message: error.message,
      storagePath,
      userId: user.id,
    });
    redirectToProfile({
      avatar: "upload",
      error: "No hemos podido subir tu foto. Inténtalo de nuevo.",
    });
  }

  await setProfileAvatarFromUpload(supabase, user.id, storagePath);
  revalidateAvatarPaths();
  redirectToProfile({
    avatar: "upload",
    success: "Foto de perfil actualizada.",
  });
}

export async function chooseTeamAvatarAction(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Inicia%20sesión%20para%20elegir%20tu%20avatar.");
  }

  await ensureProfileForUser(user);

  const teamCode = String(formData.get("team_code") ?? "").trim().toUpperCase();

  if (!teamCode) {
    redirectToProfile({
      avatar: "team",
      error: "Elige un escudo de equipo antes de guardar.",
    });
  }

  const { data, error } = await supabase
    .from("teams")
    .select("code")
    .eq("code", teamCode)
    .maybeSingle();

  if (error || !data) {
    redirectToProfile({
      avatar: "team",
      error: "No hemos podido encontrar ese escudo de equipo.",
    });
  }

  await setProfileAvatarFromTeam(supabase, user.id, teamCode);
  revalidateAvatarPaths();
  redirectToProfile({
    avatar: "team",
    success: "Escudo de equipo seleccionado.",
  });
}

export async function clearAvatarAction() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Inicia%20sesión%20para%20gestionar%20tu%20avatar.");
  }

  await ensureProfileForUser(user);
  await clearProfileAvatar(supabase, user.id);
  revalidateAvatarPaths();
  redirectToProfile({
    success: "Avatar quitado.",
  });
}
