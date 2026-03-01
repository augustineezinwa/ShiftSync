import { fromZonedTime } from "date-fns-tz";

/**
 * Parse a datetime string as local time in the given IANA timezone and return a UTC Date.
 * Input format: "YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss" (no Z suffix).
 */
export function parseLocationLocalToUtc(localDateTime: string, timezone: string): Date {
  const s = localDateTime.trim();
  return fromZonedTime(s, timezone);
}
