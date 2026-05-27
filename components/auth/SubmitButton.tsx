"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

interface SubmitButtonProps {
  activeIntent: "login" | "signup" | null;
  intent: "login" | "signup";
}

const buttonCopy = {
  login: {
    idle: "Iniciar sesión",
    pending: "Iniciando sesión...",
  },
  signup: {
    idle: "Crear cuenta",
    pending: "Creando cuenta...",
  },
} as const;

export function SubmitButton({
  activeIntent,
  intent,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const isPending = pending && activeIntent === intent;

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-pill px-6 text-sm font-semibold transition-transform duration-150 active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2",
        intent === "login"
          ? "h-12 bg-linear-to-r from-accent-primary to-accent-secondary text-background-main shadow-glowCyan hover:scale-[0.99]"
          : "h-11 border border-border-subtle bg-surface-elevated text-text-primary hover:bg-surface-active",
        pending ? "cursor-not-allowed opacity-80" : null,
      )}
      disabled={pending}
      name="intent"
      type="submit"
      value={intent}
    >
      {isPending ? (
        <Loader2 className="size-4 animate-spin" strokeWidth={2} />
      ) : null}
      {isPending ? buttonCopy[intent].pending : buttonCopy[intent].idle}
    </button>
  );
}
