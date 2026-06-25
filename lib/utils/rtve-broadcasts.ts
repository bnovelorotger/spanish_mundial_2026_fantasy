/**
 * Static mapping captured from RTVE's official World Cup 2026 calendar on
 * 2026-06-25. Matches marked with `*` are broadcast on La 1 and RTVE Play.
 *
 * Source: https://www.rtve.es/mundial-de-futbol-2026/calendario
 */
export const RTVE_BROADCAST_MATCH_NUMBERS = [55, 63, 69] as const;

const rtveBroadcastMatchNumberSet = new Set<number>(RTVE_BROADCAST_MATCH_NUMBERS);

export function isRtveBroadcastMatchNumber(matchNumber: number) {
  return rtveBroadcastMatchNumberSet.has(matchNumber);
}
