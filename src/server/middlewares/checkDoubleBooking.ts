import { createMiddleware } from "hono/factory";
import ShiftController from "../controllers/ShiftController";

export const checkDoubleBookingMiddleware = createMiddleware<{
    Variables: {
        probeUserId: number | null;
        shiftStartTime: Date | null;
        shiftEndTime: Date | null;
        shiftId: number | null;
    };
}>(async (c, next) => {
    const userId = c.get("probeUserId");
    const shiftStartTime = c.get("shiftStartTime");
    const shiftEndTime = c.get("shiftEndTime");
    const shiftId = c.get("shiftId");

    if (userId == null || shiftStartTime == null || shiftEndTime == null) {
        await next();
        return;
    }

    const existingShifts = await ShiftController.getShiftsAssignedToUser(userId, shiftId ?? undefined);
    const newStart = shiftStartTime.getTime();
    const newEnd = shiftEndTime.getTime();

    for (const existing of existingShifts) {
        const exStart = existing.startTime.getTime();
        const exEnd = existing.endTime.getTime();
        const overlaps = newStart < exEnd && exStart < newEnd;
        if (overlaps) {
            return c.json(
                { error: "User is already assigned to another shift at this time (no double-booking across locations)." },
                400
            );
        }
    }

    await next();
});
