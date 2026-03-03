import { eq, and, inArray, lte, gte } from "drizzle-orm";
import { db } from "../db";
import { onDuty, usersShifts, shifts, users, locations } from "../db/schema";

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

    /** All active duties across the given locations (for admin live on-duty view). */
    static async getLiveDutiesByLocations(locationIds: number[]) {
        const now = new Date();
        const conditions = [
            lte(onDuty.clockInAt, now),
            gte(onDuty.clockOutAt, now),
        ];
        if (locationIds.length > 0) {
            conditions.push(inArray(shifts.locationId, locationIds));
        }

        const rows = await db
            .select({
                staffId: users.id,
                staffName: users.name,
                locationId: locations.id,
                locationName: locations.name,
                shiftStart: shifts.startTime,
                shiftEnd: shifts.endTime,
            })
            .from(onDuty)
            .innerJoin(usersShifts, eq(onDuty.userShiftId, usersShifts.id))
            .innerJoin(shifts, eq(usersShifts.shiftId, shifts.id))
            .innerJoin(users, eq(onDuty.userId, users.id))
            .innerJoin(locations, eq(shifts.locationId, locations.id))
            .where(and(...conditions));

        return rows;
    }
}

export default DutyController;
