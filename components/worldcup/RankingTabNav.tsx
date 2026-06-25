import Link from "next/link";

import type { RankingTab } from "@/lib/types/worldcup";

const tabs: Array<{ href: string; label: string; tab: RankingTab }> = [
  {
    href: "/ranking?tab=overview",
    label: "Clasificación",
    tab: "overview",
  },
  {
    href: "/ranking?tab=results",
    label: "Resultados",
    tab: "results",
  },
  {
    href: "/ranking?tab=participants",
    label: "Participantes",
    tab: "participants",
  },
];

export function RankingTabNav({ currentTab }: { currentTab: RankingTab }) {
  return (
    <nav className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-2 shadow-card">
      <div className="grid grid-cols-3 gap-2">
        {tabs.map((tab) => {
          const isActive = tab.tab === currentTab;

          return (
            <Link
              key={tab.tab}
              className={
                isActive
                  ? "focus-ring inline-flex min-h-11 items-center justify-center rounded-pill border border-accent-primary/35 bg-accent-primary/10 px-3 py-2 text-center text-sm font-semibold text-text-primary shadow-glowCyan"
                  : "focus-ring inline-flex min-h-11 items-center justify-center rounded-pill border border-border-subtle bg-background-secondary/70 px-3 py-2 text-center text-sm font-semibold text-text-secondary transition-colors duration-200 hover:bg-surface-active hover:text-text-primary"
              }
              href={tab.href}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
