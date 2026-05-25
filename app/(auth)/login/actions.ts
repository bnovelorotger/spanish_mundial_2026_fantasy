"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  ensureProfileForUser,
  isProfileComplete,
} from "@/lib/services/profile.service";
import { createClient } from "@/lib/supabase/server";

function redirectWithMessage(
  params: Record<string, string>,
  pathname = "/login",
): never {
  const searchParams = new URLSearchParams(params);
  redirect(`${pathname}?${searchParams.toString()}`);
}

type AuthPayload =
  | {
      data: {
        email: string;
        intent: "login" | "signup";
        password: string;
      };
      error?: never;
    }
  | {
      data?: never;
      error: string;
    };

function validateAuthPayload(formData: FormData): AuthPayload {
  const intent = formData.get("intent");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (intent !== "login" && intent !== "signup") {
    return { error: "Elige si quieres iniciar sesión o crear una cuenta." };
  }

  if (!email.includes("@")) {
    return { error: "Introduce una dirección de correo válida." };
  }

  if (password.length < 8) {
    return { error: "La contraseña debe tener al menos 8 caracteres." };
  }

  return {
    data: {
      email,
      intent,
      password,
    },
  };
}

export async function authenticate(formData: FormData) {
  const payload: AuthPayload = validateAuthPayload(formData);

  if (!payload.data) {
    redirectWithMessage({ error: payload.error });
  }

  const authData = payload.data;
  const supabase = await createClient();

  if (authData.intent === "login") {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authData.email,
      password: authData.password,
    });

    if (error || !data.user) {
      redirectWithMessage({
        error: "No hemos podido iniciar sesión con ese correo y esa contraseña.",
      });
    }

    const profile = await ensureProfileForUser(data.user);

    revalidatePath("/", "layout");

    if (!isProfileComplete(profile)) {
      redirect("/profile?message=Termina%20de%20configurar%20tu%20perfil.");
    }

    redirect("/home?message=Ya%20est%C3%A1s%20de%20vuelta.");
  }

  const { data, error } = await supabase.auth.signUp({
    email: authData.email,
    password: authData.password,
  });

  if (error || !data.user) {
    redirectWithMessage({
      error:
        "No hemos podido crear tu cuenta. Prueba de nuevo con otra dirección de correo.",
    });
  }

  await ensureProfileForUser(data.user);
  revalidatePath("/", "layout");

  if (!data.session) {
    redirectWithMessage({
      message:
        "Cuenta creada. Revisa tu correo para confirmar la dirección antes de iniciar sesión.",
    });
  }

  redirect("/profile?message=Termina%20de%20configurar%20tu%20perfil.");
}
