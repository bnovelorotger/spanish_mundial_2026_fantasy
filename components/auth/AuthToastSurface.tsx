"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { toast } from "@/lib/utils/toast";

import { AUTH_LOADING_TOAST_IDS } from "./AuthForm";

export type AuthToastStatus =
  | "invalid_credentials"
  | "login_success"
  | "login_unexpected"
  | "signed_out"
  | "signup_duplicate_email"
  | "signup_success"
  | "signup_unexpected"
  | "signup_weak_password";

export function dismissPendingAuthToasts() {
  toast.dismiss(AUTH_LOADING_TOAST_IDS.login);
  toast.dismiss(AUTH_LOADING_TOAST_IDS.signup);
}

export function emitAuthToast(status: AuthToastStatus | null) {
  if (!status) {
    return;
  }

  switch (status) {
    case "login_success":
      toast.success("Sesión iniciada");
      return;
    case "invalid_credentials":
      toast.error("Email o contraseña incorrectos");
      return;
    case "login_unexpected":
      toast.error("No hemos podido iniciar sesión. Inténtalo en un momento.");
      return;
    case "signup_success":
      toast.success("Cuenta creada. ¡A predecir!");
      return;
    case "signup_duplicate_email":
      toast.error("Ese email ya tiene cuenta. Inicia sesión.");
      return;
    case "signup_weak_password":
      toast.error("Necesitas al menos 8 caracteres.");
      return;
    case "signup_unexpected":
      toast.error("No hemos podido crear la cuenta. Vuelve a intentarlo.");
      return;
    case "signed_out":
      toast.info("Sesión cerrada");
      return;
  }
}

export function stripAuthStatus(
  pathname: string,
  searchParams: URLSearchParams,
) {
  const params = new URLSearchParams(searchParams.toString());
  params.delete("auth_status");
  const query = params.toString();

  return query ? `${pathname}?${query}` : pathname;
}

export function consumeAuthStatusFromSearchParams(input: {
  lastHandledKey: string | null;
  pathname: string;
  replace: (href: string) => void;
  searchParams: URLSearchParams;
}) {
  dismissPendingAuthToasts();

  const status = input.searchParams.get("auth_status") as AuthToastStatus | null;

  if (!status) {
    return input.lastHandledKey;
  }

  const nextKey = `${input.pathname}?${input.searchParams.toString()}`;

  if (input.lastHandledKey === nextKey) {
    return input.lastHandledKey;
  }

  emitAuthToast(status);
  input.replace(stripAuthStatus(input.pathname, input.searchParams));

  return nextKey;
}

export function AuthToastSurface() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const handledRef = useRef<string | null>(null);

  useEffect(() => {
    handledRef.current = consumeAuthStatusFromSearchParams({
      lastHandledKey: handledRef.current,
      pathname,
      replace: (href) => router.replace(href, { scroll: false }),
      searchParams: new URLSearchParams(searchParams.toString()),
    });
  }, [pathname, router, searchParams]);

  return null;
}
