import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { Header } from "@/components/layout/Header";
import {
  ensureProfileForUser,
  isProfileComplete,
} from "@/lib/services/profile.service";
import { createClient } from "@/lib/supabase/server";

import { signOut } from "./actions";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Inicia%20sesi%C3%B3n%20para%20continuar.");
  }

  const profile = await ensureProfileForUser(user);
  const profileComplete = isProfileComplete(profile);
  const label = profile.display_name?.trim() || profile.username;

  return (
    <AppShell
      banner={
        !profileComplete ? (
          <div className="rounded-card border border-status-warning/35 bg-status-warning/10 px-4 py-3 text-sm text-text-primary">
            Ya estás dentro, pero tu perfil todavía necesita un nombre de
            usuario y un nombre visible.{" "}
            <Link className="font-semibold text-accent-primary" href="/profile">
              Terminar perfil
            </Link>
            .
          </div>
        ) : undefined
      }
      header={
        <Header
          action={
            <form action={signOut}>
              <button
                className="inline-flex h-11 items-center justify-center rounded-pill border border-border-subtle bg-surface-elevated px-5 text-sm font-semibold text-text-primary transition-colors duration-200 hover:bg-surface-active"
                type="submit"
              >
                Cerrar sesión
              </button>
            </form>
          }
          leagueName="Liga App Mundial"
          subtitle="Una carrera privada del Mundial con energía de retransmisión, tensión diaria en la clasificación y cada pronóstico bajo los focos."
          userEmail={user.email ?? "Jugador conectado"}
          userLabel={label}
        />
      }
    >
      {children}
    </AppShell>
  );
}
