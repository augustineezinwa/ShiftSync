/**
 * Shift display and premium detection utilities.
 * All shift times are stored in UTC in the DB; these helpers format and evaluate
 * using the shift's location timezone (IANA, e.g. "America/New_York").
 */

/** Format a UTC ISO datetime for date display in the given timezone */
export function formatShiftDateInTz(isoUtc: string, timezone: string): string {
  const d = new Date(isoUtc);
  if (Number.isNaN(d.getTime())) return isoUtc;
  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    dateStyle: "short",
  }).format(d);
}

/** Format a UTC ISO datetime for time display (no date) in the given timezone */
export function formatShiftTimeInTz(isoUtc: string, timezone: string): string {
  const d = new Date(isoUtc);
  if (Number.isNaN(d.getTime())) return isoUtc;
  return new Intl.DateTimeFormat(undefined, {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Premium shift: Friday or Saturday evening in the location timezone.
 * "Evening" = shift start is at or after 17:00 (5 PM) in that timezone.
 */
export function isPremiumShift(startTimeIsoUtc: string, timezone: string): boolean {
  const d = new Date(startTimeIsoUtc);
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
