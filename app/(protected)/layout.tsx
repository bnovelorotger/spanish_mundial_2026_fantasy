import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthToastSurface } from "@/components/auth/AuthToastSurface";
import { AppShell } from "@/components/layout/AppShell";
import { FinalConfettiOverlay } from "@/components/layout/FinalConfettiOverlay";
import { HeaderMinimal } from "@/components/layout/HeaderMinimal";
import { KnockoutWindowBubble } from "@/components/layout/KnockoutWindowBubble";
import { AppToaster } from "@/components/ui/AppToaster";
import { getKnockoutAlertSummary } from "@/lib/services/knockout-window.service";
import { getPhaseLock } from "@/lib/services/locks.service";
import { getFinalCelebrationSummary } from "@/lib/services/matches.service";
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
    redirect("/login?error=Inicia%20sesión%20para%20continuar.");
  }

  const profile = await ensureProfileForUser(user);
  const profileComplete = isProfileComplete(profile);
  let knockoutNotice = null;
  let finalCelebration = null;

  try {
    const [stageOneLock, stageTwoLock, finalSummary] = await Promise.all([
      getPhaseLock(supabase, "KNOCKOUT_STAGE_ONE"),
      getPhaseLock(supabase, "KNOCKOUT_STAGE_TWO"),
      getFinalCelebrationSummary(supabase),
    ]);
    knockoutNotice = getKnockoutAlertSummary({
      stageOne: stageOneLock,
      stageTwo: stageTwoLock,
    });
    finalCelebration = finalSummary;
  } catch {
    knockoutNotice = null;
    finalCelebration = null;
  }

  return (
    <>
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
          <HeaderMinimal leagueName="Liga App Mundial">
            <form action={signOut}>
              <button
                className="inline-flex h-11 items-center justify-center rounded-pill border border-border-subtle bg-surface-elevated px-5 text-sm font-semibold text-text-primary transition-colors duration-200 hover:bg-surface-active"
                type="submit"
              >
                Cerrar sesión
              </button>
            </form>
          </HeaderMinimal>
        }
        overlay={
          knockoutNotice ? <KnockoutWindowBubble notice={knockoutNotice} /> : undefined
        }
      >
        {children}
      </AppShell>
      {finalCelebration ? <FinalConfettiOverlay summary={finalCelebration} /> : null}
      <AppToaster />
      <Suspense fallback={null}>
        <AuthToastSurface />
      </Suspense>
    </>
  );
}
