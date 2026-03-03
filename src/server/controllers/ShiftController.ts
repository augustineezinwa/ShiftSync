import { db } from "@/server/db";
import { locations, shifts, skills, swapRequests, users, usersShifts } from "@/server/db/schema";
import { eachDayOfInterval, addHours, subDays, format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { HTTPException } from "hono/http-exception";
import { and, eq, inArray } from "drizzle-orm";
import { getQualifiedUsersForShift } from "../utils/qualifiedList";
import { getDateInTimezone, getFairnessAnalysis, getWeeklyProjectedOvertimeCost, groupUsersByWeeklyHours } from "../utils/timezone";

type Shift = typeof shifts.$inferSelect & {
    location: typeof locations.$inferSelect | null;
    skill: typeof skills.$inferSelect | null;
    users: typeof users.$inferSelect[];
};

class ShiftController {
    static async createShift(locationId: number, skillId: number, startTime: Date, endTime: Date, headcount: number) {
        const [shift] = await db.insert(shifts).values({ locationId, skillId, startTime, endTime, headcount, status: "draft" }).returning();
        return shift;
    }
    static async updateShift(
        id: number,
        locationId: number,
        skillId: number,
        startTime: Date,
        endTime: Date,
        headcount: number
    ) {
        const [shift] = await db
            .update(shifts)
            .set({ locationId, skillId, startTime, endTime, headcount })
            .where(eq(shifts.id, id))
            .returning();

        await db
            .update(swapRequests)
            .set({ status: "cancelled" })
            .where(
                and(
                    inArray(
                        swapRequests.userShiftId,
                        db
                            .select({ id: usersShifts.id })
                            .from(usersShifts)
                            .where(eq(usersShifts.shiftId, id))
                    ),
                    inArray(swapRequests.status, [
                        "pending_manager_approval",
                        "pending",
                    ])
                )
            );

        return shift;
    }

    /** Earliest startTime among the given shift ids (UTC). Returns null if none found. */
    static async getEarliestShiftStart(ids: number[]): Promise<Date | null> {
        if (ids.length === 0) return null;
        const rows = await db.select({ startTime: shifts.startTime }).from(shifts).where(inArray(shifts.id, ids));
        if (rows.length === 0) return null;
        const dates = rows.map((r) => (r.startTime instanceof Date ? r.startTime : new Date(r.startTime)));
        return new Date(Math.min(...dates.map((d) => d.getTime())));
    }

    static async publishSchedule(ids: number[]) {
        const list = await db.update(shifts).set({ status: "published" }).where(inArray(shifts.id, ids)).returning();
        return list;
    }

    static async getShift(id: number) {
        return await db.query.shifts.findFirst({
            with: {
                location: true,
                skill: true,
                users: true,
                usersShifts: true,
            },
            where: { id },
        });
    }

    /**
     * Get shifts, optionally filtered by week. When weekStart/weekEnd are set, only shifts
     * whose start date (in the shift's location timezone) falls in [weekStart, weekEnd] are returned.
     */
    static async getShifts(weekStart?: string, weekEnd?: string) {
        const all = await db.query.shifts.findMany({
            with: {
                location: true,
                skill: true,
                users: true,
                usersShifts: true,
            },
        });
        if (!weekStart || !weekEnd) return all;
        return all.filter((shift) => {
            const tz = shift.location?.timezone ?? "UTC";
            const startDateStr = getDateInTimezone(shift.startTime, tz);
            return startDateStr >= weekStart && startDateStr <= weekEnd;
        });
    }

    static async getShiftsByLocationId(locationId: number) {
        return await db.query.shifts.findMany({
            with: {
                location: true,
                skill: true,
                users: true,
            },
            where: { locationId },
        });
    }

    static async assignUsersToShift(shiftId: number, userIds: number[]) {
        const existing = await db.select().from(usersShifts).where(eq(usersShifts.shiftId, shiftId));
        const existingUserIds = new Set(existing.map((r) => r.userId));
        const toInsert = userIds.filter((id) => !existingUserIds.has(id));
        if (toInsert.length === 0) {
            const shift = await ShiftController.getShift(shiftId);
            return shift;
        }
        await db.insert(usersShifts).values(
            toInsert.map((userId) => ({ shiftId, userId }))
        );
        const shift = await ShiftController.getShift(shiftId);
        await db
            .update(swapRequests)
            .set({ status: "cancelled" })
            .where(
                and(
                    inArray(
                        swapRequests.userShiftId,
                        db
                            .select({ id: usersShifts.id })
                            .from(usersShifts)
                            .where(eq(usersShifts.shiftId, shiftId))
                    ),
                    inArray(swapRequests.status, [
                        "pending_manager_approval",
                        "pending",
                    ])
                )
            );
        return shift;
    }

    static async unassignUserFromShift(shiftId: number, userId: number) {
        await db.delete(usersShifts).where(and(eq(usersShifts.shiftId, shiftId), eq(usersShifts.userId, userId)));
        await db
            .update(swapRequests)
            .set({ status: "cancelled" })
            .where(
                and(
                    inArray(
                        swapRequests.userShiftId,
                        db
                            .select({ id: usersShifts.id })
                            .from(usersShifts)
                            .where(eq(usersShifts.shiftId, shiftId))
                    ),
                    inArray(swapRequests.status, [
                        "pending_manager_approval",
                        "pending",
                    ])
                )
            );
        return ShiftController.getShift(shiftId);
    }

    /** Delete shift and all its assignments. */
    static async deleteShift(id: number) {
        await db.delete(usersShifts).where(eq(usersShifts.shiftId, id));
        await db.delete(shifts).where(eq(shifts.id, id));
    }

    /**
     * Shifts the user is assigned to. Optional weekStart/weekEnd filter: only shifts whose
     * start date (in the shift's location timezone) falls in [weekStart, weekEnd].
     */
    static async getMyShifts(userId: number, weekStart?: string, weekEnd?: string) {
        const assignedRows = await db
            .select({ shiftId: usersShifts.shiftId })
            .from(usersShifts)
            .innerJoin(shifts, eq(usersShifts.shiftId, shifts.id))
            .where(
                and(
                    eq(usersShifts.userId, userId),
                    eq(shifts.status, "published")
                )
            );
        const assignedIds = assignedRows.map((r) => r.shiftId);
        if (assignedIds.length === 0) return [];
        const allMatching = await ShiftController.getShifts(weekStart, weekEnd);
        const idSet = new Set(assignedIds);
        return allMatching.filter((s) => idSet.has(s.id));
    }

    /** Shifts the user is assigned to (id, startTime, endTime). Optionally exclude one shift (e.g. the one being assigned). */
    static async getShiftsAssignedToUser(userId: number, excludeShiftId?: number): Promise<{ id: number; startTime: Date; endTime: Date }[]> {
        const assignedRows = await db
            .select({ shiftId: usersShifts.shiftId })
            .from(usersShifts)
            .where(eq(usersShifts.userId, userId));
        let assignedIds = assignedRows.map((r) => r.shiftId);
        if (excludeShiftId != null) assignedIds = assignedIds.filter((id) => id !== excludeShiftId);
        if (assignedIds.length === 0) return [];
        const rows = await db
            .select({ id: shifts.id, startTime: shifts.startTime, endTime: shifts.endTime })
            .from(shifts)
            .where(inArray(shifts.id, assignedIds));
        return rows;
    }

    static async getQualifiedUsersForShift(shiftId: number) {
        return await getQualifiedUsersForShift(shiftId);
    }

    static async getQualifiedShiftsForUser(userId: number, locationIds: number[]) {
        const qualifiedShifts = [];
        const shiftsInUserLocations = await db.query.shifts.findMany({
            with: {
                location: true,
                skill: true,
                users: true,
            },
            where: {
                status: "published",
                locationId: {
                    in: locationIds
                }
            }
        });
        for (const shift of shiftsInUserLocations) {
            const qualifiedUsers = await getQualifiedUsersForShift(shift.id);
            if (qualifiedUsers.some((user) => user.id === userId)) {
                qualifiedShifts.push(shift);
            }
        }

        return qualifiedShifts.filter((shift) => shift.users.length > 0 && !shift.users.some((user) => user.id === userId));
    }

    /**
     * Returns compliance warnings for a user before assigning them to a shift
     */
    static async getComplianceWarningsForUser(
        userId: number,
        shiftId: number,
    ): Promise<{ warnings: string[] }> {
        const shiftToAssign = await ShiftController.getShift(shiftId);
        const existingShifts = await ShiftController.getShiftsByUserId(userId);
        if (!shiftToAssign?.location) return { warnings: [] };

        const tz = shiftToAssign.location.timezone;
        const shiftStart = toZonedTime(this.toDate(shiftToAssign.startTime), tz);
        const shiftEnd = toZonedTime(this.toDate(shiftToAssign.endTime), tz);

        const warnings: string[] = [];

        // Daily hours
        const dailyHours = this.getHoursPerDay([...existingShifts, shiftToAssign], tz);
        for (const [dayStr, hours] of Object.entries(dailyHours)) {
            if (hours > 12) {
                throw new HTTPException(400, { message: `Daily hours exceed 12h on ${dayStr}.` });
            }
            if (hours > 8) warnings.push(`Daily hours exceed 8h on ${dayStr}.`);
        }

        // Weekly hours (sum of all shifts starting in the same week as shiftStart)
        const weekStart = subDays(shiftStart, shiftStart.getDay()); // Sunday
        const weekEnd = addHours(weekStart, 7 * 24);
        let weeklyHours = 0;
        for (const s of [...existingShifts, shiftToAssign]) {
            if (!s.location) continue;
            const sStart = toZonedTime(this.toDate(s.startTime), s.location.timezone);
            if (sStart >= weekStart && sStart < weekEnd) {
                const sEnd = toZonedTime(this.toDate(s.endTime), s.location.timezone);
                weeklyHours += this.hoursBetween(sStart, sEnd);
            }
        }
        if (weeklyHours >= 35 && weeklyHours < 40) warnings.push(`Weekly hours approaching 40h (35+).`);
        if (weeklyHours >= 40) warnings.push(`Weekly hours exceeded 40h (current: ${weeklyHours}h).`);

        // Consecutive days
        const consecutiveWarning = this.getConsecutiveDaysWarning([...existingShifts, shiftToAssign], tz);
        if (consecutiveWarning) warnings.push(consecutiveWarning);

        return { warnings };
    }

    /** Calculate hours per day for multiple shifts, respecting their timezones */
    private static getHoursPerDay(shifts: Shift[], tz: string): Record<string, number> {
        const dayHours: Record<string, number> = {};

        for (const s of shifts) {
            if (!s.location) continue;
            const sStart = toZonedTime(this.toDate(s.startTime), s.location.timezone);
            const sEnd = toZonedTime(this.toDate(s.endTime), s.location.timezone);

            eachDayOfInterval({ start: sStart, end: sEnd }).forEach(day => {
                const dayStr = format(day, "yyyy-MM-dd");
                const dayStart = new Date(day);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = addHours(dayStart, 24);
                const shiftStart = sStart > dayStart ? sStart : dayStart;
                const shiftEnd = sEnd < dayEnd ? sEnd : dayEnd;
                const hours = shiftEnd > shiftStart ? this.hoursBetween(shiftStart, shiftEnd) : 0;
                dayHours[dayStr] = (dayHours[dayStr] || 0) + hours;
            });
        }

        return dayHours;
    }

    /** Calculate consecutive days warning (6th/7th day) */
    private static getConsecutiveDaysWarning(shifts: Shift[], tz: string): string | null {
        const daysSet = new Set<string>();
        for (const s of shifts) {
            if (!s.location) continue;
            const sStart = toZonedTime(this.toDate(s.startTime), s.location.timezone);
            const sEnd = toZonedTime(this.toDate(s.endTime), s.location.timezone);
            eachDayOfInterval({ start: sStart, end: sEnd }).forEach(d => {
                daysSet.add(format(d, "yyyy-MM-dd"));
            });
        }

        const sortedDays = Array.from(daysSet).sort();
        const lastDay = parseISO(sortedDays[sortedDays.length - 1]);

        let consecutive = 1;
        for (let i = 1; i <= 6; i++) {
            const prev = format(subDays(lastDay, i), "yyyy-MM-dd");
            if (daysSet.has(prev)) consecutive++;
            else break;
        }

        if (consecutive >= 7) return "7th consecutive day (requires override).";
        if (consecutive >= 6) return "6th consecutive day.";
        return null;
    }

    /** Get hours between two Date objects */
    private static hoursBetween(start: Date, end: Date): number {
        return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    }

    private static toDate(v: Date | string) {
        return v instanceof Date ? v : new Date(v);
    }

    private static async getShiftsByUserId(userId: number) {
        return await db.query.shifts.findMany({
            with: {
                location: true,
                skill: true,
                users: true,
            },
            where: {
                users: {
                    id: userId
                }
            }
        });
    }

    static async getOverTimeCostsForWeeklySchedule(weekStart: string, weekEnd: string) {
        console.log("weekStart", weekStart);
        console.log("weekEnd", weekEnd);
        const shifts = await ShiftController.getShifts(weekStart, weekEnd);
        return getWeeklyProjectedOvertimeCost(shifts);
    }

    static async getUsersByWeeklyHours(weekStart: string, weekEnd: string, locationIds: number[]) {
        const shifts = await ShiftController.getShifts(weekStart, weekEnd)
        const shiftsInUserLocations = shifts.filter((s) => s.locationId && locationIds.includes(s.locationId));
        return groupUsersByWeeklyHours(shiftsInUserLocations);
    }

    static async getFairnessAnalytics(weekStart: string, weekEnd: string, locationIds: number[]) {
        const shifts = await ShiftController.getShifts(weekStart, weekEnd)
        const shiftsInUserLocations = shifts.filter((s) => s.locationId && locationIds.includes(s.locationId));
        return getFairnessAnalysis(shiftsInUserLocations);
    }
}

export default ShiftController;