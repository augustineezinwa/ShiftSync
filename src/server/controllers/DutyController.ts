import { eq, and } from "drizzle-orm";
import { db } from "../db";
import { onDuty, usersShifts, shifts } from "../db/schema";

class DutyController {
    /** Create a clock-in record for the user's assignment to the given shift. */
    static async createDuty(userId: number, shiftId: number) {
        const [userShift] = await db
            .select()
            .from(usersShifts)
.where(and(eq(usersShifts.userId, userId), eq(usersShifts.shiftId, shiftId)))
            .limit(1);
        if (!userShift) return null;
        const [existing] = await db.select().from(onDuty).where(eq(onDuty.userShiftId, userShift.id)).limit(1);
        if (existing) return null; // already clocked in
        const [shift] = await db.select({ endTime: shifts.endTime }).from(shifts).where(eq(shifts.id, shiftId)).limit(1);
        if (!shift) return null;
        const now = new Date();
        const clockOutAt = shift.endTime instanceof Date ? shift.endTime : new Date(shift.endTime);
        const [duty] = await db
            .insert(onDuty)
            .values({
                userId,
                userShiftId: userShift.id,
                clockInAt: now,
                clockOutAt: clockOutAt > now ? clockOutAt : now,
            })
            .returning();
        return duty;
    }

    /** Get all duty records for the current user, with shiftId for each. */
    static async getMyDuties(userId: number) {
        const rows = await db
            .select({
                id: onDuty.id,
                userShiftId: onDuty.userShiftId,
                shiftId: usersShifts.shiftId,
                clockInAt: onDuty.clockInAt,
                clockOutAt: onDuty.clockOutAt,
            })
            .from(onDuty)
            .innerJoin(usersShifts, eq(onDuty.userShiftId, usersShifts.id))
            .where(eq(onDuty.userId, userId));
        return rows;
    }
}

export default DutyController;
