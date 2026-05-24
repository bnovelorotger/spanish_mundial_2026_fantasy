import Link from "next/link";
import { redirect } from "next/navigation";

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
    <main className="mx-auto min-h-screen w-full max-w-4xl px-4 py-6 sm:px-6">
      <div className="space-y-4">
        <header className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-primary">
                Tournament access
              </p>
              <h1 className="mt-2 text-2xl font-semibold text-text-primary">
                {label}
              </h1>
              <p className="mt-1 text-sm text-text-secondary">
                {user.email ?? "Signed-in player"}
              </p>
            </div>

            <form action={signOut}>
              <button
                className="inline-flex h-11 items-center justify-center rounded-pill border border-border-subtle bg-surface-elevated px-5 text-sm font-semibold text-text-primary transition-colors duration-200 hover:bg-surface-active"
                type="submit"
              >
                Log out
              </button>
            </form>
          </div>
        </header>

        {!profileComplete ? (
          <div className="rounded-card border border-status-warning/35 bg-status-warning/10 px-4 py-3 text-sm text-text-primary">
            Your account is in, but your profile still needs a username and
            display name.{" "}
            <Link className="font-semibold text-accent-primary" href="/profile">
              Finish profile setup
            </Link>
            .
          </div>
        ) : null}

        {children}
      </div>
    </main>
  );
}
