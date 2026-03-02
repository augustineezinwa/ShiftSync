import ShiftController from "../controllers/ShiftController";
import { db } from "../db";
import { users, skills, locations, usersAvailability, usersLocations } from "../db/schema";

type User = typeof users.$inferSelect & {
    skills: typeof skills.$inferSelect[];
    locations: typeof locations.$inferSelect[];
    availabilities: typeof usersAvailability.$inferSelect[];
};

const MIN_HOURS_BETWEEN_SHIFTS = 10;
const MS_PER_HOUR = 60 * 60 * 1000;

const WEEKDAY_TO_NUM: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Get day of week (0=Sun, 1=Mon, ..., 6=Sat) in the given timezone. */
function getDayOfWeekInTz(date: Date, timezone: string): number {
    const short = new Intl.DateTimeFormat("en-US", { timeZone: timezone, weekday: "short" }).format(date);
    return WEEKDAY_TO_NUM[short] ?? 0;
}

/** Get time string HH:mm:ss in the given timezone from a Date. */
function getTimeStringInTz(date: Date, timezone: string): string {
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

/** Same as assertAvailability: shift (in shift TZ) falls completely within an active availability for that day. */
function userAvailabilityCoversShift(
    availabilities: { dayOfWeek: number; startTime: unknown; endTime: unknown; isActive: boolean }[],
    shiftStart: Date,
    shiftEnd: Date,
    timezone: string
): boolean {
    const tz = timezone ?? "UTC";
    const shiftDayJs = getDayOfWeekInTz(shiftStart, tz); // 0=Sun, 1=Mon, ..., 6=Sat
    const shiftDayDb = (shiftDayJs + 6) % 7; // app/DB: 0=Mon, 1=Tue, ..., 6=Sun
    const shiftStartStr = getTimeStringInTz(shiftStart, tz);
    const shiftEndStr = getTimeStringInTz(shiftEnd, tz);
    const forDay = availabilities.filter((a) => a.dayOfWeek === shiftDayDb && a.isActive);
    return forDay.some(
        (a) => String(a.startTime) <= shiftStartStr && String(a.endTime) >= shiftEndStr
    );
}

/** Same as checkDoubleBooking: no overlapping shifts for this user. */
function userHasOverlappingShift(userId: number, shiftId: number, shiftStart: Date, shiftEnd: Date): Promise<boolean> {
    return ShiftController.getShiftsAssignedToUser(userId, shiftId).then((shifts) => {
        const start = shiftStart.getTime();
        const end = shiftEnd.getTime();
        return shifts.some((s) => {
            const sStart = s.startTime.getTime();
            const sEnd = s.endTime.getTime();
            return start < sEnd && sStart < end;
        });
    });
}

/** Same as assertMinHoursBetweenShifts: no shift in the 10h window before shift start. */
function userHasShiftInMinHoursWindow(userId: number, shiftId: number, shiftStart: Date): Promise<boolean> {
    const windowEndMs = shiftStart.getTime();
    const windowStartMs = windowEndMs - MIN_HOURS_BETWEEN_SHIFTS * MS_PER_HOUR;
    return ShiftController.getShiftsAssignedToUser(userId, shiftId).then((shifts) =>
        shifts.some((s) => {
            const t = s.startTime.getTime();
            const u = s.endTime.getTime();
            return (t >= windowStartMs && t <= windowEndMs) || (u >= windowStartMs && u <= windowEndMs);
        })
    );
}

/**
 * Returns the list of users qualified for a shift: same location, required skill, availability,
 * and no double-booking or violation of minimum 10 hours between shifts.
 */
export async function getQualifiedUsersForShift(shiftId: number) {
    const shift = await ShiftController.getShift(shiftId);
    if (!shift) {
        return [];
    }

    const shiftSkill = shift.skill;
    const shiftLocation = shift.location;
    const shiftStartTime = shift.startTime instanceof Date ? shift.startTime : new Date(shift.startTime);
    const shiftEndTime = shift.endTime instanceof Date ? shift.endTime : new Date(shift.endTime);
    const shiftTimezone = shiftLocation?.timezone ?? "UTC";

    const userLocations = await db.query.usersLocations.findMany({
        where: {
            locationId: Number(shiftLocation?.id),
        },
    });
    const usersAtLocation = await db.query.users.findMany({
        with: {
            skills: true,
            locations: true,
            availabilities: true,
        },
        where: {
            id: { in: userLocations.map((ul) => Number(ul.userId)) },
        },
    });

    const bySkillLocationAvailability = usersAtLocation.filter((user) => {
        return (
            user?.skills.some((s) => s.id === shiftSkill?.id) &&
            user.locations.some((loc) => loc.id === shiftLocation?.id) &&
            userAvailabilityCoversShift(user.availabilities, shiftStartTime, shiftEndTime, shiftTimezone)
        );
    });

    const qualifiedUsers: User[] = [];
    for (const user of bySkillLocationAvailability) {
        const [overlap, inWindow] = await Promise.all([
            userHasOverlappingShift(user.id, shiftId, shiftStartTime, shiftEndTime),
            userHasShiftInMinHoursWindow(user.id, shiftId, shiftStartTime),
        ]);
        if (!overlap && !inWindow) {
            qualifiedUsers.push(user);
        }
    }

    return qualifiedUsers;
}


/** Returns a string of user names as bullet points. If label is set, returns "" when users is empty (so the label and list are not shown). */
export function getFormattedUsersWithBulletPoints(users: User[], label?: string): string {
    if (!users.length) return "";
    const bullets = users.map((u) => "• " + (u.name ?? "Unknown")).join("\n");
    return label ? `\n${label}\n${bullets}` : bullets;
}