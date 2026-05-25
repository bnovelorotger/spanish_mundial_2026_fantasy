export const SERVER_TIME_ZONE_FALLBACK = "Europe/Madrid";

export function formatKickoff(
  isoUtc: string,
  timeZone: string,
  locale = "es-ES",
) {
  const date = new Date(isoUtc);

  return {
    date: new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      timeZone,
    }).format(date),
    time: new Intl.DateTimeFormat(locale, {
      hour: "2-digit",
      hour12: false,
      minute: "2-digit",
      timeZone,
    }).format(date),
  };
}
