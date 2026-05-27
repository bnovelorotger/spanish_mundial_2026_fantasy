"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  ensureProfileForUser,
  isProfileComplete,
} from "@/lib/services/profile.service";
import { createClient } from "@/lib/supabase/server";

import type { AuthToastStatus } from "@/components/auth/AuthToastSurface";

function redirectWithStatus(status: AuthToastStatus, pathname = "/login"): never {
  redirect(`${pathname}?auth_status=${status}`);
}

type AuthPayload =
  | {
      data: {
        email: string;
        intent: "login" | "signup";
        password: string;
      };
      errorStatus?: never;
    }
  | {
      data?: never;
      errorStatus: AuthToastStatus;
    };

function validateAuthPayload(formData: FormData): AuthPayload {
  const intent = formData.get("intent");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (intent !== "login" && intent !== "signup") {
    return { errorStatus: "login_unexpected" };
  }

  if (!email.includes("@")) {
    return {
      errorStatus: intent === "login" ? "invalid_credentials" : "signup_unexpected",
    };
  }

  if (password.length < 8) {
    return {
      errorStatus: intent === "signup" ? "signup_weak_password" : "invalid_credentials",
    };
  }

  return {
    data: {
      email,
      intent,
      password,
    },
  };
}

function isDuplicateEmailError(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("already registered") ||
    normalized.includes("already been registered") ||
    normalized.includes("already exists") ||
    normalized.includes("user already registered")
  );
}

function isInvalidCredentialsError(message: string) {
  const normalized = message.toLowerCase();

  return normalized.includes("invalid login credentials");
}

export async function authenticate(formData: FormData) {
  const payload = validateAuthPayload(formData);

  if (!payload.data) {
    redirectWithStatus(payload.errorStatus);
  }

  const authData = payload.data;
  const supabase = await createClient();

  if (authData.intent === "login") {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: authData.email,
      password: authData.password,
    });

    if (error || !data.user) {
      redirectWithStatus(
        error && isInvalidCredentialsError(error.message)
          ? "invalid_credentials"
          : "login_unexpected",
      );
    }

    const profile = await ensureProfileForUser(data.user);

    revalidatePath("/", "layout");

    if (!isProfileComplete(profile)) {
      redirect("/profile?auth_status=login_success");
    }

    redirect("/home?auth_status=login_success");
  }

  const { data, error } = await supabase.auth.signUp({
    email: authData.email,
    password: authData.password,
  });

  if (error || !data.user) {
    redirectWithStatus(
      error && isDuplicateEmailError(error.message)
        ? "signup_duplicate_email"
        : "signup_unexpected",
    );
  }

  await ensureProfileForUser(data.user);
  revalidatePath("/", "layout");

  if (!data.session) {
    redirect("/login?auth_status=signup_success");
  }

  redirect("/profile?auth_status=signup_success");
}
