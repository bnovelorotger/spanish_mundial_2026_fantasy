"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Calendar,
  House,
  Target,
  Trophy,
  UserRound,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

const navItems: NavItem[] = [
  { href: "/dashboard", icon: House, label: "Home" },
  { href: "/predictions", icon: Target, label: "Predictions" },
  { href: "/calendar", icon: Calendar, label: "Matches" },
  { href: "/ranking", icon: Trophy, label: "Ranking" },
  { href: "/profile", icon: UserRound, label: "Profile" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border-subtle bg-[rgba(8,13,24,0.86)] backdrop-blur-[16px]">
      <div className="mx-auto grid w-full max-w-3xl grid-cols-5 px-2 py-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              className={cn(
                "flex min-h-16 flex-col items-center justify-center gap-1 rounded-card px-1 text-[11px] font-medium text-text-muted transition-colors duration-200",
                isActive && "bg-accent-primary/10 text-text-primary shadow-glowCyan",
              )}
              href={href}
            >
              <Icon
                className={cn(
                  "size-5",
                  isActive ? "text-accent-primary" : "text-text-muted",
                )}
                strokeWidth={2}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
