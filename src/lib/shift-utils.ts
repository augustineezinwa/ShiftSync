/**
 * Shift display and premium detection utilities.
 * All shift times are stored in UTC in the DB; these helpers format and evaluate
 * using the shift's location timezone (IANA, e.g. "America/New_York").
 */

/** Parse a value as UTC. ISO strings without Z are treated as UTC (backend stores UTC). */
function parseAsUtc(value: string | Date): Date {
  if (value instanceof Date) return value;
  const s = typeof value === "string" ? value.trim() : "";
  if (!s) return new Date(NaN);
  // If no timezone suffix (no Z or ±offset), assume UTC so we don't interpret as browser local time
  const asUtc = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?$/i.test(s) ? `${s}Z` : s;
  return new Date(asUtc);
}

/** Format a UTC ISO datetime for date display in the given timezone */
export function formatShiftDateInTz(isoUtc: string | Date, timezone: string): string {
  const d = parseAsUtc(isoUtc);
  if (Number.isNaN(d.getTime())) return typeof isoUtc === "string" ? isoUtc : "";
  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    dateStyle: "short",
  }).format(d);
}

/** Format a UTC ISO datetime for time display (no date) in the given timezone */
export function formatShiftTimeInTz(isoUtc: string | Date, timezone: string): string {
  const d = parseAsUtc(isoUtc);
  if (Number.isNaN(d.getTime())) return typeof isoUtc === "string" ? isoUtc : "";
  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
}

/**
 * Premium shift: Friday or Saturday evening in the location timezone.
 * "Evening" = shift start is at or after 17:00 (5 PM) in that timezone.
 */
export function isPremiumShift(startTimeIsoUtc: string | Date, timezone: string): boolean {
  const d = parseAsUtc(startTimeIsoUtc);
  if (Number.isNaN(d.getTime())) return false;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(d);
  let weekday: string | null = null;
  let hour = 0;
  let minute = 0;
  for (const p of parts) {
    if (p.type === "weekday") weekday = p.value;
    if (p.type === "hour") hour = parseInt(p.value, 10);
    if (p.type === "minute") minute = parseInt(p.value, 10);
  }
  const isFriday = weekday === "Fri";
  const isSaturday = weekday === "Sat";
  const minutesSinceMidnight = hour * 60 + minute;
  const eveningStartMinutes = 17 * 60; // 17:00
  const isEvening = minutesSinceMidnight >= eveningStartMinutes;
  return (isFriday || isSaturday) && isEvening;
}
