import { siteConfig } from "@/lib/config/site";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-12 pt-6 sm:px-6 lg:px-8">
      <section className="flex flex-1 flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.28em] text-accent-primary">
              {siteConfig.badge}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
              {siteConfig.name}
            </h1>
          </div>
          <span className="rounded-pill border border-accent-primary/35 bg-accent-primary/14 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent-primary">
            Phase 1
          </span>
        </div>

        <div className="rounded-cardLg border border-accent-primary/35 bg-surface-elevated/90 p-6 shadow-card shadow-glowCyan">
          <p className="text-sm font-medium uppercase tracking-[0.28em] text-text-secondary">
            Mobile-first foundation
          </p>
          <h2 className="mt-3 max-w-xl text-3xl font-semibold tracking-tight text-text-primary sm:text-5xl">
            Build the tournament before the first kickoff.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-text-secondary">
            App Router, strict TypeScript, brandbook tokens, testing, and the
            private-tournament visual system are in place before auth, picks,
            ranking, and sync arrive in later phases.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              className="inline-flex h-12 items-center justify-center rounded-pill bg-linear-to-r from-accent-primary to-accent-secondary px-6 text-sm font-semibold text-background-main shadow-glowCyan transition-transform duration-200 hover:scale-[0.99]"
              href="#features"
            >
              See the MVP pillars
            </a>
            <a
              className="inline-flex h-11 items-center justify-center rounded-pill border border-border-subtle bg-surface-card px-6 text-sm font-semibold text-text-primary transition-colors duration-200 hover:bg-surface-active"
              href="#stack"
            >
              Review the foundation
            </a>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {siteConfig.stats.map((stat) => (
            <article
              key={stat.label}
              className="rounded-card border border-border-subtle bg-surface-card/90 p-4 shadow-card"
            >
              <p className="font-numeric text-2xl font-bold text-text-primary">
                {stat.value}
              </p>
              <p className="mt-2 text-sm font-medium text-text-secondary">
                {stat.label}
              </p>
              <p className="mt-1 text-sm text-text-muted">{stat.description}</p>
            </article>
          ))}
        </div>

        <div id="features" className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className="rounded-card border border-border-subtle bg-surface-card/85 p-5 shadow-card">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-accent-secondary">
                  MVP pillars
                </p>
                <h3 className="mt-2 text-lg font-semibold text-text-primary">
                  Private Tournament Mode starts with a stable base.
                </h3>
              </div>
              <span className="rounded-pill border border-accent-secondary/35 bg-accent-secondary/16 px-3 py-1 text-xs font-semibold text-text-primary">
                Ready for Phase 2
              </span>
            </div>
            <div className="mt-5 grid gap-3">
              {siteConfig.features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-card border border-border-subtle bg-background-secondary/80 p-4"
                >
                  <p className="text-sm font-semibold text-text-primary">
                    {feature.title}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-text-secondary">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section
            id="stack"
            className="rounded-card border border-border-subtle bg-surface-card/85 p-5 shadow-card"
          >
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-status-warning">
              Phase boundary
            </p>
            <h3 className="mt-2 text-lg font-semibold text-text-primary">
              Auth, picks, ranking, and sync stay out of Phase 1.
            </h3>
            <ul className="mt-5 grid gap-3">
              {siteConfig.stack.map((item) => (
                <li
                  key={item}
                  className="rounded-card border border-border-subtle bg-background-secondary/80 px-4 py-3 text-sm text-text-secondary"
                >
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </section>
    </main>
  );
}
