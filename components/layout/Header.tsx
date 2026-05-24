import type { ReactNode } from "react";

import { Shield, Users } from "lucide-react";

interface HeaderProps {
  action: ReactNode;
  leagueName: string;
  subtitle: string;
  userEmail: string;
  userLabel: string;
}

export function Header({
  action,
  leagueName,
  subtitle,
  userEmail,
  userLabel,
}: HeaderProps) {
  return (
    <header className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
      <div className="flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-pill border border-accent-primary/35 bg-accent-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-primary">
              <Shield className="size-3.5" strokeWidth={2} />
              Private league
            </div>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
              {leagueName}
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-text-secondary">
              {subtitle}
            </p>
          </div>
          <div className="shrink-0">{action}</div>
        </div>

        <div className="flex flex-col gap-3 rounded-card border border-border-subtle bg-background-secondary/75 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
              Signed in
            </p>
            <p className="mt-1 text-base font-semibold text-text-primary">
              {userLabel}
            </p>
            <p className="text-sm text-text-secondary">{userEmail}</p>
          </div>
          <div className="inline-flex items-center gap-2 self-start rounded-pill border border-border-subtle bg-surface-card px-3 py-2 text-xs font-medium text-text-secondary sm:self-auto">
            <Users className="size-3.5 text-accent-secondary" strokeWidth={2} />
            Friends-only tournament
          </div>
        </div>
      </div>
    </header>
  );
}
