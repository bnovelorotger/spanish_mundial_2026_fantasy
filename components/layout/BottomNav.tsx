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
  activePaths: string[];
  href: string;
  icon: LucideIcon;
  label: string;
}

const navItems: NavItem[] = [
  {
    activePaths: ["/dashboard", "/home"],
    href: "/home",
    icon: House,
    label: "Inicio",
  },
  {
    activePaths: ["/predictions"],
    href: "/predictions",
    icon: Target,
    label: "Predicciones",
  },
  {
    activePaths: ["/calendar", "/matches"],
    href: "/matches",
    icon: Calendar,
    label: "Partidos",
  },
  {
    activePaths: ["/ranking"],
    href: "/ranking",
    icon: Trophy,
    label: "Clasificación",
  },
  {
    activePaths: ["/profile"],
    href: "/profile",
    icon: UserRound,
    label: "Perfil",
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border-subtle bg-[rgba(8,13,24,0.86)] backdrop-blur-[16px]"
      data-tour="bottom-nav"
    >
      <div className="mx-auto grid w-full max-w-3xl grid-cols-5 px-2 py-2">
        {navItems.map(({ activePaths, href, icon: Icon, label }) => {
          const isActive = activePaths.some(
            (activePath) =>
              pathname === activePath || pathname.startsWith(`${activePath}/`),
          );

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
