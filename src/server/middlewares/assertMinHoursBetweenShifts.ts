import { createMiddleware } from "hono/factory";
import ShiftController from "../controllers/ShiftController";

const MIN_HOURS_BETWEEN_SHIFTS = 10;
const MS_PER_HOUR = 60 * 60 * 1000;

export const assertMinHoursBetweenShiftsMiddleware = createMiddleware<{
    Variables: {
        probeUserId: number | null;
        shiftStartTime: Date | null;
        shiftId: number | null;
    };
}>(async (c, next) => {
    const userId = c.get("probeUserId");
    const shiftStartTime = c.get("shiftStartTime");
    const shiftId = c.get("shiftId");

    if (userId == null || shiftStartTime == null) {
        await next();
        return;
    }

    const existingShifts = await ShiftController.getShiftsAssignedToUser(userId, shiftId ?? undefined);

    const windowEndMs = shiftStartTime.getTime();
    const windowStartMs = windowEndMs - MIN_HOURS_BETWEEN_SHIFTS * MS_PER_HOUR;

    const inWindow = (t: Date) => {
        const ms = t.getTime();
        return ms >= windowStartMs && ms <= windowEndMs;
    };

    for (const existing of existingShifts) {
        if (inWindow(existing.startTime) || inWindow(existing.endTime)) {
            return c.json(
                {
                    error: `User must have at least ${MIN_HOURS_BETWEEN_SHIFTS} hours before this shift. They have an existing shift in that window.`,
                },
                400
            );
        }
    }

    await next();
});
