import type { ReactNode } from "react";

import { BottomNav } from "./BottomNav";

interface AppShellProps {
  banner?: ReactNode;
  children: ReactNode;
  header: ReactNode;
  overlay?: ReactNode;
}

export function AppShell({ banner, children, header, overlay }: AppShellProps) {
  return (
    <div className="min-h-screen">
      {overlay}
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
