import { redirect } from "next/navigation";

import {
  ensureProfileForUser,
  isProfileComplete,
} from "@/lib/services/profile.service";
import { createClient } from "@/lib/supabase/server";

import { updateProfile } from "./actions";

type ProfilePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(
  searchParams: Record<string, string | string[] | undefined>,
  key: string,
) {
  const value = searchParams[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProfilePage({ searchParams }: ProfilePageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?error=Sign%20in%20to%20continue.");
  }

  const profile = await ensureProfileForUser(user);
  const params = (await searchParams) ?? {};
  const error = getQueryValue(params, "error");
  const message = getQueryValue(params, "message");
  const success = getQueryValue(params, "success");
  const profileComplete = isProfileComplete(profile);

  return (
    <section className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-6 shadow-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-secondary">
            Profile setup
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-text-primary">
            Complete your tournament identity
          </h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">
            Pick the username and display name your friends will see in the
            ranking table later in the tournament.
          </p>
        </div>

        <span className="rounded-pill border border-border-subtle bg-background-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-text-secondary">
          {profileComplete ? "Ready" : "Needs attention"}
        </span>
      </div>

      {error ? (
        <div className="mt-5 rounded-card border border-status-live/35 bg-status-live/10 px-4 py-3 text-sm text-text-primary">
          {error}
        </div>
      ) : null}

      {!error && success ? (
        <div className="mt-5 rounded-card border border-status-success/35 bg-status-success/10 px-4 py-3 text-sm text-text-primary">
          {success}
        </div>
      ) : null}

      {!error && !success && message ? (
        <div className="mt-5 rounded-card border border-accent-primary/35 bg-accent-primary/10 px-4 py-3 text-sm text-text-primary">
          {message}
        </div>
      ) : null}

      <dl className="mt-6 grid gap-4 rounded-card border border-border-subtle bg-background-secondary/70 p-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
            Email
          </dt>
          <dd className="mt-1 text-sm text-text-primary">
            {user.email ?? "Unavailable"}
          </dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
            Current username
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
            Username
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
            Use 3-24 lowercase characters, numbers, or underscores.
          </p>
        </div>

        <div>
          <label
            className="mb-2 block text-sm font-medium text-text-secondary"
            htmlFor="display_name"
          >
            Display name
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
          Save profile
        </button>
      </form>
    </section>
  );
}
