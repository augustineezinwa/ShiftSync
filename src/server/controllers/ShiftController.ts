import { db } from "@/server/db";
import { shifts, swapRequests, usersShifts } from "@/server/db/schema";
import { and, asc, eq, exists, inArray } from "drizzle-orm";
import { getQualifiedUsersForShift } from "../utils/qualifiedList";

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
            const startDateStr = ShiftController.getStartDateInTimezone(shift.startTime, tz);
            return startDateStr >= weekStart && startDateStr <= weekEnd;
        });
    }

    /** Return YYYY-MM-DD of the given UTC date in the given IANA timezone. */
    private static getStartDateInTimezone(utcDate: Date | string, timezone: string): string {
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
}

export default ShiftController;