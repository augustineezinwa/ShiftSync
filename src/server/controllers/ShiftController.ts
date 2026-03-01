import { db } from "@/server/db";
import { shifts } from "@/server/db/schema";
import { eq, inArray } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

class ShiftController {
    static async createShift(locationId: number, skillId: number, startTime: Date, endTime: Date, headcount: number) {
        // check hour limit
        if (Math.abs(startTime.getTime() - endTime.getTime()) / (1000 * 60 * 60) > 12) {
            throw new HTTPException(400, { message: "Shift duration must be less than 12 hours" });
        }
        const [shift] = await db.insert(shifts).values({ locationId, skillId, startTime, endTime, headcount, status: "draft" }).returning();
        return shift;
    }
    static async updateShift(id: number, locationId: number, skillId: number, startTime: Date, endTime: Date, headcount: number) {
        const [shift] = await db.update(shifts).set({ locationId, skillId, startTime, endTime, headcount }).where(eq(shifts.id, id)).returning();
        return shift;
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
            },
            where: { id },
        });
    }

    static async getShifts() {
        return await db.query.shifts.findMany({
            with: {
                location: true,
                skill: true,
                users: true,
            },
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

}

export default ShiftController;