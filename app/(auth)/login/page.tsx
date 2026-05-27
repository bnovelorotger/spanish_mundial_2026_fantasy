import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthForm } from "@/components/auth/AuthForm";
import { createClient } from "@/lib/supabase/server";

import { authenticate } from "./actions";

type LoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/home");
  }

  const params = (await searchParams) ?? {};
  const error = getQueryValue(params, "error");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10 sm:px-6">
      <section className="w-full rounded-cardLg border border-border-subtle bg-surface-card/90 p-6 shadow-card">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-accent-primary">
          Modo Torneo Privado
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">
          Inicia sesión en tu torneo
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Usa tu correo y tu contraseña para entrar en la quiniela del Mundial
          2026. Los jugadores nuevos también pueden crear su cuenta desde este
          mismo formulario.
        </p>

        {error ? (
          <div className="mt-5 rounded-card border border-status-live/35 bg-status-live/10 px-4 py-3 text-sm text-text-primary">
            {error}
          </div>
        ) : null}

        <AuthForm action={authenticate} />

        <p className="mt-5 text-sm text-text-muted">
          El acceso al torneo se gestiona con autenticación segura de Supabase
          en servidor. Puedes volver a la{" "}
          <Link className="text-accent-primary" href="/">
            página inicial
          </Link>{" "}
          cuando quieras.
        </p>
      </section>
    </main>
  );
}
