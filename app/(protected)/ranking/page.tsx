import Link from "next/link";

export default function RankingPage() {
  return (
    <section className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-6 shadow-card">
      <p className="text-sm font-medium uppercase tracking-[0.18em] text-podium-gold">
        Ranking shell
      </p>
      <h1 className="mt-2 text-2xl font-semibold text-text-primary">
        Full ranking treatment lands in Phase 7.
      </h1>
      <p className="mt-3 text-sm leading-6 text-text-secondary">
        The podium board and points logic are intentionally deferred. This
        route exists now so the shell navigation is complete.
      </p>
      <Link
        className="mt-5 inline-flex h-11 items-center justify-center rounded-pill border border-border-subtle bg-surface-elevated px-5 text-sm font-semibold text-text-primary transition-colors duration-200 hover:bg-surface-active"
        href="/dashboard"
      >
        Back to dashboard
      </Link>
    </section>
  );
}
