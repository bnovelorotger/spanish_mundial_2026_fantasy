"use client";

import type { ReactNode } from "react";

import { usePathname } from "next/navigation";

interface HeaderMinimalProps {
  children: ReactNode;
  leagueName: string;
}

export function HeaderMinimal({
  children,
  leagueName,
}: HeaderMinimalProps) {
  const pathname = usePathname();

  if (pathname === "/profile" || pathname.startsWith("/profile/")) {
    return null;
  }

  return (
    <header className="rounded-cardLg border border-border-subtle bg-surface-card/90 p-5 shadow-card">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-text-primary sm:text-2xl">
          {leagueName}
        </h1>
        <div className="shrink-0">{children}</div>
      </div>
    </header>
  );
}
