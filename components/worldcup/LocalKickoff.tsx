"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";
import {
  formatKickoff,
  SERVER_TIME_ZONE_FALLBACK,
} from "@/lib/utils/datetime";

interface LocalKickoffProps {
  className?: string;
  dateClassName?: string;
  isoUtc: string;
  locale?: string;
  separator?: string;
  timeClassName?: string;
}

export function LocalKickoff({
  className,
  dateClassName,
  isoUtc,
  locale = "en-US",
  separator = " · ",
  timeClassName,
}: LocalKickoffProps) {
  const [timeZone, setTimeZone] = useState(SERVER_TIME_ZONE_FALLBACK);

  useEffect(() => {
    const detectedTimeZone =
      Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (detectedTimeZone) {
      const timeoutId = window.setTimeout(() => {
        setTimeZone(detectedTimeZone);
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }
  }, []);

  const { date, time } = formatKickoff(isoUtc, timeZone, locale);

  return (
    <span className={className}>
      <span className={cn(dateClassName)} suppressHydrationWarning>
        {date}
      </span>
      {separator}
      <span className={cn(timeClassName)} suppressHydrationWarning>
        {time}
      </span>
    </span>
  );
}
