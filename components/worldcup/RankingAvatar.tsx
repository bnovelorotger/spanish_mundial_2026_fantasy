import Image from "next/image";

import { cn } from "@/lib/utils";

interface RankingAvatarProps {
  avatarUrl: string | null;
  className?: string;
  fallback: string;
  name: string;
}

export function RankingAvatar({
  avatarUrl,
  className,
  fallback,
  name,
}: RankingAvatarProps) {
  if (avatarUrl) {
    return (
      <Image
        alt={`Avatar de ${name}`}
        className={cn(
          "rounded-full border border-border-subtle object-cover",
          className,
        )}
        height={44}
        src={avatarUrl}
        width={44}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full border border-border-subtle bg-surface-card text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary",
        className,
      )}
    >
      {fallback}
    </div>
  );
}
