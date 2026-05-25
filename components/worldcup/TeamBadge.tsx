"use client";

import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface TeamBadgeProps {
  code?: string;
  flagUrl?: string | null;
  highlighted?: boolean;
  isPlaceholder?: boolean;
  name: string;
}

function initialsFromName(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function TeamBadge({
  code,
  flagUrl,
  highlighted = false,
  isPlaceholder = false,
  name,
}: TeamBadgeProps) {
  const [failedFlagUrl, setFailedFlagUrl] = useState<string | null>(null);
  const showFlag = Boolean(flagUrl) && flagUrl !== failedFlagUrl && !isPlaceholder;
  const resolvedFlagUrl = showFlag ? flagUrl ?? "" : "";

  return (
    <div className="flex min-w-0 items-center gap-3">
      {showFlag ? (
        <Image
          alt={`${name} flag`}
          className="size-10 rounded-full border border-border-subtle object-cover"
          height={40}
          onError={() => setFailedFlagUrl(flagUrl ?? null)}
          src={resolvedFlagUrl}
          width={40}
        />
      ) : (
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full border text-xs font-semibold uppercase tracking-[0.12em]",
            isPlaceholder
              ? "border-border-subtle bg-background-secondary text-text-muted"
              : "border-accent-primary/30 bg-accent-primary/10 text-accent-primary",
          )}
        >
          {code ?? initialsFromName(name)}
        </div>
      )}

      <div className="min-w-0">
        <p
          className={cn(
            "truncate text-sm font-semibold",
            highlighted ? "text-text-primary" : "text-text-secondary",
          )}
        >
          {name}
        </p>
        {code ? (
          <p className="mt-0.5 text-xs font-medium uppercase tracking-[0.16em] text-text-muted">
            {code}
          </p>
        ) : null}
      </div>
    </div>
  );
}
