import { createMiddleware } from "hono/factory";
import { usersAvailability } from "@/server/db/schema";
import { getFormattedUsersWithBulletPoints, getQualifiedUsersForShift } from "../utils/qualifiedList";

type Availability = typeof usersAvailability.$inferSelect;

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

export const assertAvailabilityMiddleware = createMiddleware<{
    Variables: {
        shiftStartTime: Date | null;
        shiftEndTime: Date | null;
        shiftTimezone: string;
        probeUserAvailabilities: Availability[];
        shiftId: number | null;
    };
}>(async (c, next) => {
    const shiftStartTime = c.get("shiftStartTime");
    const shiftEndTime = c.get("shiftEndTime");
    const shiftTimezone = c.get("shiftTimezone");
    const shiftId = c.get("shiftId");
    const probeUserAvailabilities = c.get("probeUserAvailabilities");
    const qualifiedUsers = await getQualifiedUsersForShift(Number(shiftId));

    const hasAvailability =
        shiftStartTime &&
        shiftEndTime &&
        (() => {
            const tz = shiftTimezone ?? "UTC";
            const shiftDayJs = getDayOfWeekInTz(shiftStartTime, tz); // 0=Sun, 1=Mon, ..., 6=Sat
            const shiftDayDb = (shiftDayJs + 6) % 7; // app/DB: 0=Mon, 1=Tue, ..., 6=Sun
            const shiftStartStr = getTimeStringInTz(shiftStartTime, tz);
            const shiftEndStr = getTimeStringInTz(shiftEndTime, tz);
            const forDay = probeUserAvailabilities.filter((a) => a.dayOfWeek === shiftDayDb && a.isActive);
            // User is available only if the shift falls completely within their availability window
            return forDay.some(
                (a) =>
                    String(a.startTime) <= shiftStartStr &&
                    String(a.endTime) >= shiftEndStr
            );
        })();

    if (!hasAvailability) {
        const qualifiedSection = getFormattedUsersWithBulletPoints(qualifiedUsers, "Qualified users:");
        return c.json(
            { error: qualifiedSection ? `User is not available for this shift.\n${qualifiedSection}` : "User is not available for this shift." },
            400
        );
    }

    await next();
});
