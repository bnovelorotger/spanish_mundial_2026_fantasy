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
    redirect("/login?error=Sign%20in%20to%20continue.");
  }

  const profile = await ensureProfileForUser(user);
  const profileComplete = isProfileComplete(profile);
  const label = profile.display_name?.trim() || profile.username;

  return (
    <AppShell
      banner={
        !profileComplete ? (
          <div className="rounded-card border border-status-warning/35 bg-status-warning/10 px-4 py-3 text-sm text-text-primary">
            Your account is in, but your profile still needs a username and
            display name.{" "}
            <Link className="font-semibold text-accent-primary" href="/profile">
              Finish profile setup
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
                Log out
              </button>
            </form>
          }
          leagueName="App Mundial League"
          subtitle="A private World Cup race with broadcast energy, daily ranking tension, and every pick under the lights."
          userEmail={user.email ?? "Signed-in player"}
          userLabel={label}
        />
      }
    >
      {children}
    </AppShell>
  );
}
