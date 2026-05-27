import Image from "next/image";
import { redirect } from "next/navigation";

import { OnboardingTour } from "@/components/onboarding/OnboardingTour";
import { ResetOnboardingButton } from "@/components/onboarding/ResetOnboardingButton";
import { Header } from "@/components/layout/Header";
import { AvatarUploadForm } from "@/components/profile/AvatarUploadForm";
import { ONBOARDING_TOURS } from "@/lib/onboarding/tours";
import {
  ensureProfileForUser,
  isProfileComplete,
} from "@/lib/services/profile.service";
import { createClient } from "@/lib/supabase/server";

import {
  chooseTeamAvatarAction,
  clearAvatarAction,
  updateProfile,
  uploadAvatarAction,
} from "./actions";
import { signOut } from "../actions";

type ProfilePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

type AvatarMode = "team" | "upload";

interface TeamAvatarOption {
  code: string;
  flag_url: string | null;
  group_letter: string;
  name: string;
}

function getQueryValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

function resolveAvatarMode(value: string | undefined): AvatarMode {
  return value === "team" ? "team" : "upload";
}

function initialsFromLabel(label: string) {
  return label
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function AvatarModeLink({
  activeMode,
  label,
  mode,
}: {
  activeMode: AvatarMode;
  label: string;
  mode: AvatarMode;
}) {
  const isActive = activeMode === mode;

  return (
    <a
      className={
        isActive
          ? "inline-flex h-11 items-center justify-center rounded-pill border border-accent-primary/35 bg-accent-primary/10 px-5 text-sm font-semibold text-accent-primary shadow-glowCyan"
          : "inline-flex h-11 items-center justify-center rounded-pill border border-border-subtle bg-surface-card px-5 text-sm font-semibold text-text-secondary transition-colors duration-200 hover:bg-surface-active"
      }
      href={mode === "upload" ? "/profile?avatar=upload" : "/profile?avatar=team"}
    >
      {label}
    </a>
  );
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Inicia%20sesión%20para%20continuar.");
  }

  const profile = await ensureProfileForUser(user);
  const params = (await searchParams) ?? {};
  const activeAvatarMode = resolveAvatarMode(getQueryValue(params, "avatar"));
  const error = getQueryValue(params, "error");
  const message = getQueryValue(params, "message");
  const success = getQueryValue(params, "success");
  const profileComplete = isProfileComplete(profile);
  const label = profile.display_name?.trim() || profile.username;

  const { data: teamsData, error: teamsError } = await supabase
    .from("teams")
    .select("code, name, flag_url, group_letter")
    .eq("is_tbd", false)
    .order("group_letter", { ascending: true })
    .order("name", { ascending: true });

  if (teamsError) {
    throw new Error(`Could not load profile avatar teams: ${teamsError.message}`);
  }

  const teams = (teamsData as TeamAvatarOption[]) ?? [];
  const selectedTeam =
    teams.find((team) => team.code === profile.avatar_team_code) ?? null;
  const resolvedAvatarUrl =
    profile.avatar_url ?? selectedTeam?.flag_url ?? null;

  return (
    <OnboardingTour steps={ONBOARDING_TOURS.profile} tourId="profile">
      <section className="space-y-6">
        <Header
          action={
            <form action={signOut}>
              <button
                className="inline-flex h-11 items-center justify-center rounded-pill border border-border-subtle bg-surface-elevated px-5 text-sm font-semibold text-text-primary transition-colors duration-200 hover:bg-surface-active"
                data-tour="logout"
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

        {error ? (
          <div
            className="rounded-card border border-status-live/35 bg-status-live/10 px-4 py-3 text-sm text-text-primary"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {!error && success ? (
          <div
            aria-live="polite"
            className="rounded-card border border-status-success/35 bg-status-success/10 px-4 py-3 text-sm text-text-primary"
          >
            {success}
          </div>
        ) : null}

        {!error && !success && message ? (
          <div
            aria-live="polite"
            className="rounded-card border border-accent-primary/35 bg-accent-primary/10 px-4 py-3 text-sm text-text-primary"
          >
            {message}
          </div>
        ) : null}

        <section
          className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-6 shadow-card"
          data-tour="avatar-section"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-primary">
                Foto de perfil
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-text-primary">
                Elige cómo apareces en la clasificación
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Puedes subir una foto o jugar con el escudo de tu selección favorita.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-card border border-border-subtle bg-background-secondary/70 px-4 py-3">
              {resolvedAvatarUrl ? (
                <Image
                  alt={`Avatar actual de ${label}`}
                  className="size-16 rounded-full border border-border-subtle object-cover"
                  height={64}
                  src={resolvedAvatarUrl}
                  width={64}
                />
              ) : (
                <div className="flex size-16 items-center justify-center rounded-full border border-accent-primary/30 bg-accent-primary/10 font-semibold uppercase tracking-[0.12em] text-accent-primary">
                  {initialsFromLabel(label)}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-text-primary">Avatar actual</p>
                <p className="mt-1 text-sm text-text-secondary">
                  {profile.avatar_url
                    ? "Foto subida"
                    : profile.avatar_team_code
                      ? `Escudo ${profile.avatar_team_code}`
                      : "Todavía sin avatar"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <AvatarModeLink activeMode={activeAvatarMode} label="Subir foto" mode="upload" />
            <AvatarModeLink activeMode={activeAvatarMode} label="Escudo de equipo" mode="team" />
          </div>

          <div className="mt-6">
            {activeAvatarMode === "upload" ? (
              <AvatarUploadForm
                currentAvatarUrl={profile.avatar_url}
                fallbackLabel={label}
                uploadAction={uploadAvatarAction}
              />
            ) : (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-text-secondary">
                  Elige uno de los 48 escudos disponibles. Tu selección quedará marcada con el aro cian.
                </p>
                <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
                  {teams.map((team) => {
                    const isSelected = profile.avatar_team_code === team.code;
                    const selectAction = chooseTeamAvatarAction.bind(null, team.code);

                    return (
                      <form action={selectAction} key={team.code}>
                        <button
                          className={
                            isSelected
                              ? "flex w-full flex-col items-center gap-2 rounded-card border border-accent-primary/40 bg-accent-primary/10 px-3 py-3 text-center shadow-glowCyan"
                              : "flex w-full flex-col items-center gap-2 rounded-card border border-border-subtle bg-background-secondary/70 px-3 py-3 text-center transition-colors duration-200 hover:bg-surface-active"
                          }
                          type="submit"
                        >
                          {team.flag_url ? (
                            <Image
                              alt={`Escudo de ${team.name}`}
                              className="size-12 rounded-full border border-border-subtle object-cover"
                              height={48}
                              src={team.flag_url}
                              width={48}
                            />
                          ) : (
                            <div className="flex size-12 items-center justify-center rounded-full border border-accent-primary/30 bg-accent-primary/10 text-sm font-semibold uppercase tracking-[0.12em] text-accent-primary">
                              {team.code}
                            </div>
                          )}
                          <span className="text-xs font-semibold uppercase tracking-[0.16em] text-text-secondary">
                            {team.code}
                          </span>
                        </button>
                      </form>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <form action={clearAvatarAction} className="mt-6">
            <button
              className="inline-flex h-11 items-center justify-center rounded-pill border border-border-subtle bg-surface-elevated px-5 text-sm font-semibold text-text-primary transition-colors duration-200 hover:bg-surface-active"
              type="submit"
            >
              Quitar avatar
            </button>
          </form>
        </section>

        <section className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-6 shadow-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-secondary">
                Perfil
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-text-primary">
                Completa tu identidad en el torneo
              </h2>
              <p className="mt-2 text-sm leading-6 text-text-secondary">
                Elige el nombre de usuario y el nombre visible que verán tus amigos
                en la clasificación durante el torneo.
              </p>
            </div>

            <span className="rounded-pill border border-border-subtle bg-background-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
              {profileComplete ? "Listo" : "Necesita atención"}
            </span>
          </div>

          <dl className="mt-6 grid gap-4 rounded-card border border-border-subtle bg-background-secondary/70 p-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Correo electrónico
              </dt>
              <dd className="mt-1 text-sm text-text-primary">
                {user.email ?? "No disponible"}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                Nombre de usuario actual
              </dt>
              <dd className="mt-1 text-sm text-text-primary">{profile.username}</dd>
            </div>
          </dl>

          <form action={updateProfile} className="mt-6 space-y-4">
            <div>
              <label
                className="mb-2 block text-sm font-medium text-text-secondary"
                htmlFor="username"
              >
                Nombre de usuario
              </label>
              <input
                className="h-12 w-full rounded-card border border-border-subtle bg-background-secondary px-4 text-base text-text-primary outline-none transition-colors focus:border-accent-primary"
                defaultValue={profile.username}
                id="username"
                maxLength={24}
                minLength={3}
                name="username"
                required
                type="text"
              />
              <p className="mt-2 text-xs text-text-muted">
                Usa entre 3 y 24 caracteres en minúscula, números o guiones bajos.
              </p>
            </div>

            <div>
              <label
                className="mb-2 block text-sm font-medium text-text-secondary"
                htmlFor="display_name"
              >
                Nombre visible
              </label>
              <input
                className="h-12 w-full rounded-card border border-border-subtle bg-background-secondary px-4 text-base text-text-primary outline-none transition-colors focus:border-accent-primary"
                defaultValue={profile.display_name ?? ""}
                id="display_name"
                maxLength={50}
                minLength={2}
                name="display_name"
                required
                type="text"
              />
            </div>

            <button
              className="inline-flex h-12 items-center justify-center rounded-pill bg-linear-to-r from-accent-primary to-accent-secondary px-6 text-sm font-semibold text-background-main shadow-glowCyan transition-transform duration-200 hover:scale-[0.99]"
              type="submit"
            >
              Guardar perfil
            </button>
          </form>
        </section>

        <div className="flex justify-end">
          <ResetOnboardingButton />
        </div>
      </section>
    </OnboardingTour>
  );
}
