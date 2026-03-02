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
 * "Evening" = any part of the shift occurs at or after 17:00 (5 PM) in that timezone.
 * We use the shift's start date to determine the weekday, and the shift's end time to
 * determine whether it reaches evening.
 */
export function isPremiumShift(
  startTimeIsoUtc: string | Date,
  endTimeIsoUtc: string | Date,
  timezone: string
): boolean {
  const start = parseAsUtc(startTimeIsoUtc);
  const end = parseAsUtc(endTimeIsoUtc);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;

  // Weekday based on the shift start in the location timezone
  const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
  });
  const weekday = weekdayFormatter.format(start);

  const isFriday = weekday === "Fri";
  const isSaturday = weekday === "Sat";
  if (!isFriday && !isSaturday) return false;

  // Time based on the shift end in the location timezone
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = timeFormatter.formatToParts(end);
  let hour = 0;
  let minute = 0;
  for (const p of parts) {
    if (p.type === "hour") hour = parseInt(p.value, 10);
    if (p.type === "minute") minute = parseInt(p.value, 10);
  }
  const minutesSinceMidnight = hour * 60 + minute;
  const eveningStartMinutes = 17 * 60; // 17:00
  const reachesEvening = minutesSinceMidnight >= eveningStartMinutes;
  return reachesEvening;
}
