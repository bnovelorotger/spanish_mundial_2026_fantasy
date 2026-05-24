import Link from "next/link";
import { redirect } from "next/navigation";

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
    redirect("/dashboard");
  }

  const params = (await searchParams) ?? {};
  const error = getQueryValue(params, "error");
  const message = getQueryValue(params, "message");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10 sm:px-6">
      <section className="w-full rounded-cardLg border border-border-subtle bg-surface-card/90 p-6 shadow-card">
        <p className="text-sm font-medium uppercase tracking-[0.28em] text-accent-primary">
          Private Tournament Mode
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary">
          Sign in to your tournament
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-secondary">
          Use your email and password to enter the World Cup 2026 Pick&apos;em.
          New players can create their account from the same form.
        </p>

        {error ? (
          <div className="mt-5 rounded-card border border-status-live/35 bg-status-live/10 px-4 py-3 text-sm text-text-primary">
            {error}
          </div>
        ) : null}

        {!error && message ? (
          <div className="mt-5 rounded-card border border-accent-primary/35 bg-accent-primary/10 px-4 py-3 text-sm text-text-primary">
            {message}
          </div>
        ) : null}

        <form action={authenticate} className="mt-6 space-y-4">
          <div>
            <label
              className="mb-2 block text-sm font-medium text-text-secondary"
              htmlFor="email"
            >
              Email
            </label>
            <input
              className="h-12 w-full rounded-card border border-border-subtle bg-background-secondary px-4 text-base text-text-primary outline-none transition-colors focus:border-accent-primary"
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
              Password
            </label>
            <input
              className="h-12 w-full rounded-card border border-border-subtle bg-background-secondary px-4 text-base text-text-primary outline-none transition-colors focus:border-accent-primary"
              id="password"
              minLength={8}
              name="password"
              placeholder="At least 8 characters"
              required
              type="password"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              className="inline-flex h-12 items-center justify-center rounded-pill bg-linear-to-r from-accent-primary to-accent-secondary px-6 text-sm font-semibold text-background-main shadow-glowCyan transition-transform duration-200 hover:scale-[0.99]"
              name="intent"
              type="submit"
              value="login"
            >
              Log in
            </button>
            <button
              className="inline-flex h-11 items-center justify-center rounded-pill border border-border-subtle bg-surface-elevated px-6 text-sm font-semibold text-text-primary transition-colors duration-200 hover:bg-surface-active"
              name="intent"
              type="submit"
              value="signup"
            >
              Create account
            </button>
          </div>
        </form>

        <p className="mt-5 text-sm text-text-muted">
          Tournament access is handled with secure Supabase server-side auth.
          You can go back to the{" "}
          <Link className="text-accent-primary" href="/">
            landing page
          </Link>{" "}
          at any time.
        </p>
      </section>
    </main>
  );
}
