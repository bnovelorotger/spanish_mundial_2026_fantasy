"use client";

import { useState, type FormEvent } from "react";

import { toast } from "@/lib/utils/toast";

import { SubmitButton } from "./SubmitButton";

interface AuthFormProps {
  action: (formData: FormData) => void | Promise<void>;
}

export const AUTH_LOADING_TOAST_IDS = {
  login: "auth-login-loading",
  signup: "auth-signup-loading",
} as const;

function loadingCopy(intent: "login" | "signup") {
  return intent === "login"
    ? "Iniciando sesión..."
    : "Creando cuenta...";
}

export function AuthForm({ action }: AuthFormProps) {
  const [activeIntent, setActiveIntent] = useState<"login" | "signup" | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const nativeEvent = event.nativeEvent as SubmitEvent;
    const submitter = nativeEvent.submitter;

    if (!(submitter instanceof HTMLButtonElement)) {
      return;
    }

    const intent = submitter.value === "signup" ? "signup" : "login";

    setActiveIntent(intent);
    toast.dismiss(AUTH_LOADING_TOAST_IDS.login);
    toast.dismiss(AUTH_LOADING_TOAST_IDS.signup);
    toast.loading(loadingCopy(intent), {
      id: AUTH_LOADING_TOAST_IDS[intent],
    });
  }

  return (
    <form action={action} className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <div>
        <label
          className="mb-2 block text-sm font-medium text-text-secondary"
          htmlFor="email"
        >
          Correo electrónico
        </label>
        <input
          className="focus-ring h-12 w-full rounded-card border border-border-subtle bg-background-secondary px-4 text-base text-text-primary outline-none transition-colors focus:border-accent-primary"
          id="email"
          name="email"
          placeholder="name@example.com"
          required
          type="email"
        />
      </div>

      <div>
        <label
          className="mb-2 block text-sm font-medium text-text-secondary"
          htmlFor="password"
        >
          Contraseña
        </label>
        <input
          className="focus-ring h-12 w-full rounded-card border border-border-subtle bg-background-secondary px-4 text-base text-text-primary outline-none transition-colors focus:border-accent-primary"
          id="password"
          minLength={8}
          name="password"
          placeholder="Mínimo 8 caracteres"
          required
          type="password"
        />
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <SubmitButton activeIntent={activeIntent} intent="login" />
        <SubmitButton activeIntent={activeIntent} intent="signup" />
      </div>
    </form>
  );
}
