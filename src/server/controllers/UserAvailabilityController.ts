import { db } from "@/server/db";
import { usersAvailability } from "@/server/db/schema";
import { and, eq } from "drizzle-orm";
import { asc } from "drizzle-orm";

class UserAvailabilityController {
    static async createUserAvailability(userId: number, dayOfWeek: number, startTime: string, endTime: string, isActive = true) {
        const [row] = await db.insert(usersAvailability).values({ userId, dayOfWeek, startTime, endTime, isActive }).returning();
        return row;
    }

    static async getUserAvailability(id: number) {
        return await db.query.usersAvailability.findFirst({
            where: { id },
        });
    }

    static async getUserAvailabilities(userId: number) {
        return await db.select().from(usersAvailability).where(eq(usersAvailability.userId, userId)).orderBy(asc(usersAvailability.dayOfWeek));
    }

    static async updateUserAvailability(userId: number, dayOfWeek: number, isActive: boolean, startTime: string, endTime: string) {
        const [existing] = await db.select().from(usersAvailability).where(and(eq(usersAvailability.userId, userId), eq(usersAvailability.dayOfWeek, dayOfWeek))).limit(1);
        if (existing) {
            const [updated] = await db.update(usersAvailability).set({ isActive, startTime, endTime }).where(and(eq(usersAvailability.userId, userId), eq(usersAvailability.dayOfWeek, dayOfWeek))).returning();
            return updated;
        }
        return this.createUserAvailability(userId, dayOfWeek, startTime, endTime, isActive);
    }
}

export default UserAvailabilityController;