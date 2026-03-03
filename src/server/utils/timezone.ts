import { addDays, eachHourOfInterval, format, getDay, getHours, parseISO, subDays } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { locations, shifts, skills, users } from "../db/schema";

const WEEKLY_LIMIT = 40;
const OVERTIME_MULTIPLIER = 1;

type Shift = typeof shifts.$inferSelect & {
  location: typeof locations.$inferSelect | null;
  skill: typeof skills.$inferSelect | null;
  users: typeof users.$inferSelect[];
};

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




export function getWeeklyProjectedOvertimeCost(shifts: Shift[]) {
  const userMap = new Map<number, { hours: number; rate: number }>();

  shifts.forEach(s => {
    const hours = durationHours(new Date(s.startTime), new Date(s.endTime));

    console.log("hours", hours);
    console.log("s.users", s.users);

    for (const user of s.users) {
      if (!userMap.has(user.id)) {
        userMap.set(user.id, { hours, rate: user.hourlyRate || 0 });
      } else {
        userMap.get(user.id)!.hours += hours;
      }
    }
  });

  let totalOvertimeCost = 0;
  let totalOvertimeHours = 0;


  for (const { hours, rate } of Array.from(userMap.values())) {
    const overtimeHours = Math.max(hours - WEEKLY_LIMIT, 0);
    totalOvertimeHours += overtimeHours;
    totalOvertimeCost += overtimeHours * rate * OVERTIME_MULTIPLIER;
  }

  return { totalOvertimeCost, overtimeHours: totalOvertimeHours };
}

export function groupUsersByWeeklyHours(shifts: Shift[]) {
  const userMap = new Map<number, { id: number, name: string, weeklyHours: number, notes: string, status: string }>();

  shifts.forEach(s => {
    for (const user of s.users) {
      if (!userMap.has(user.id)) {
        userMap.set(user.id, { id: user.id, name: user.name, weeklyHours: 0, notes: getWarningsFromHours(0), status: getStatusFromHours(0) });
      }
      userMap.get(user.id)!.weeklyHours += durationHours(new Date(s.startTime), new Date(s.endTime));
      userMap.get(user.id)!.notes = getWarningsFromHours(userMap.get(user.id)!.weeklyHours);
      userMap.get(user.id)!.status = getStatusFromHours(userMap.get(user.id)!.weeklyHours);
    }
  });

  return Array.from(userMap.values());
}

export function getStatusFromHours(hours: number) {
  if (hours < 40) return "✅ OK";
  if (hours === 40) return "⚠️ At weekly limit";
  return "🔴 Over";
}

export function getWarningsFromHours(hours: number) {
  if (hours < 35) return "";
  if (hours === 35) return "Approaching 40h warning";
  if (hours === 40) return "At weekly limit";
  return "Weekly hours exceeded 40h";
}

export function isPremiumShift(shift: Shift): boolean {
  const tz = shift.location?.timezone ?? "UTC";

  const localStart = toZonedTime(shift.startTime, tz);
  const localEnd = toZonedTime(shift.endTime, tz);

  const hours = eachHourOfInterval({ start: localStart, end: localEnd });

  return hours.some(date => {
    const day = getDay(date);
    const hour = getHours(date);
    return (day === 5 || day === 6) && hour >= 18;
  });
}

export function getFairnessAnalysis(shifts: Shift[]) {
  const userMap = new Map<number, {
    id: number;
    name: string;
    location: string | undefined;
    assignedHours: number;
    desiredHours: number;
    premiumShifts: number;
  }>();

  shifts.forEach(s => {
    const hours = durationHours(s.startTime, s.endTime);
    const premium = isPremiumShift(s);

    for (const user of s.users) {
      if (!userMap.has(user.id)) {
        userMap.set(user.id, {
          id: user.id,
          name: user.name,
          location: s.location?.name,
          desiredHours: user.hoursPerWeek ?? 0,
          assignedHours: hours,
          premiumShifts: premium ? 1 : 0
        });
      } else {
        const entry = userMap.get(user.id)!;
        entry.assignedHours += hours;
        if (premium) entry.premiumShifts += 1;
      }
    }
  });

  const users = Array.from(userMap.values());

  const sortedHours = users
    .map(u => u.assignedHours)
    .sort((a, b) => a - b);

  const mid = Math.floor(sortedHours.length / 2);

  const teamMedian =
    sortedHours.length === 0
      ? 0
      : sortedHours.length % 2 === 0
        ? (sortedHours[mid - 1] + sortedHours[mid]) / 2
        : sortedHours[mid];

  return users.map(u => {
    const fairnessDiff = u.assignedHours - teamMedian;
    const overloadDiff = u.assignedHours - u.desiredHours;

    let status: "Under" | "Balanced" | "Over";

    if (overloadDiff > 0) status = "Over";
    else if (overloadDiff < 0) status = "Under";
    else status = "Balanced";

    return {
      ...u,
      teamMedian,
      fairnessDiff,
      overloadDiff,
      status
    };
  });
}


/** Format a Date in a given timezone */
export function formatTimeInTz(date: Date | string, tz: string) {
  const d = typeof date === "string" ? new Date(date) : date;
  const zoned = toZonedTime(d, tz);
  return format(zoned, "EEE, MMM d yyyy 'at' HH:mm");
}

