"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import {
  formatKickoff,
  SERVER_TIME_ZONE_FALLBACK,
} from "@/lib/utils/datetime";

interface LocalKickoffProps {
  children: (parts: { date: string; time: string }) => ReactNode;
  isoUtc: string;
  locale?: string;
}

export function LocalKickoff({
  children,
  isoUtc,
  locale = "en-US",
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

  return <>{children(formatKickoff(isoUtc, timeZone, locale))}</>;
}
