import type { ReactNode } from "react";

import { BottomNav } from "./BottomNav";

interface AppShellProps {
  banner?: ReactNode;
  children: ReactNode;
  header: ReactNode;
}

export function AppShell({ banner, children, header }: AppShellProps) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-28 pt-4 sm:px-6">
        <div className="space-y-4">
          {header}
          {banner}
          <div className="space-y-6">{children}</div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
