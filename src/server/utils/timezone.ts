import { addDays, format, parseISO, subDays } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

/**
 * Parse a datetime string as local time in the given IANA timezone and return a UTC Date.
 * Input format: "YYYY-MM-DDTHH:mm" or "YYYY-MM-DDTHH:mm:ss" (no Z suffix).
 */
export function parseLocationLocalToUtc(localDateTime: string, timezone: string): Date {
  const s = localDateTime.trim();
  return fromZonedTime(s, timezone);
}

export { fromZonedTime };

/** Duration in hours between two dates. */
export function durationHours(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

const WEEKDAY_TO_NUM: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Get day of week (0=Sun, 1=Mon, ..., 6=Sat) in the given timezone. */
export function getDayOfWeekInTz(date: Date, timezone: string): number {
  const short = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(date);
  return WEEKDAY_TO_NUM[short] ?? 0;
}

/** Get time string HH:mm:ss in the given timezone from a Date. */
export function getTimeStringInTz(date: Date, timezone: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const second = parts.find((p) => p.type === "second")?.value ?? "00";
  return `${hour}:${minute}:${second}`;
}

/** Return YYYY-MM-DD of the given UTC date in the given IANA timezone. */
export function getDateInTimezone(utcDate: Date | string, timezone: string): string {
  const d = typeof utcDate === "string" ? new Date(utcDate) : utcDate;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  const day = parts.find((p) => p.type === "day")?.value ?? "";
  return `${y}-${m}-${day}`;
}

/** Monday–Sunday week containing the given UTC date in the given timezone. Returns { start, end } as YYYY-MM-DD. */
export function getWeekRangeInTimezone(utcDate: Date | string, timezone: string): { start: string; end: string } {
  const dateStr = getDateInTimezone(utcDate, timezone);
  const weekday = getDayOfWeekInTz(typeof utcDate === "string" ? new Date(utcDate) : utcDate, timezone);
  const daysFromMonday = (weekday - 1 + 7) % 7;
  const weekStart = format(subDays(parseISO(dateStr), daysFromMonday), "yyyy-MM-dd");
  const weekEnd = format(addDays(parseISO(weekStart), 6), "yyyy-MM-dd");
  return { start: weekStart, end: weekEnd };
}
