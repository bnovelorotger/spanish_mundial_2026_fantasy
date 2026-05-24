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
    return { error: "Choose whether you want to log in or create an account." };
  }

  if (!email.includes("@")) {
    return { error: "Enter a valid email address." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters long." };
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
        error: "We couldn't sign you in with that email and password.",
      });
    }

    const profile = await ensureProfileForUser(data.user);

    revalidatePath("/", "layout");

    if (!isProfileComplete(profile)) {
      redirect("/profile?message=Finish%20setting%20up%20your%20profile.");
    }

    redirect("/profile?success=Welcome%20back.");
  }

  const { data, error } = await supabase.auth.signUp({
    email: authData.email,
    password: authData.password,
  });

  if (error || !data.user) {
    redirectWithMessage({
      error:
        "We couldn't create your account. Try again with a different email address.",
    });
  }

  await ensureProfileForUser(data.user);
  revalidatePath("/", "layout");

  if (!data.session) {
    redirectWithMessage({
      message:
        "Account created. Check your email to confirm your address before signing in.",
    });
  }

  redirect("/profile?message=Finish%20setting%20up%20your%20profile.");
}
