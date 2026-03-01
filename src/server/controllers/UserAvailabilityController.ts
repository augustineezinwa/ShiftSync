import { db } from "@/server/db";
import { usersAvailability } from "@/server/db/schema";
import { eq } from "drizzle-orm";

class UserAvailabilityController {
    static async createUserAvailability(userId: number, dayOfWeek: number, startTime: Date, endTime: Date) {
        const userAvailability = await db.insert(usersAvailability).values({ userId, dayOfWeek, startTime, endTime }).returning();
        return userAvailability[0];
    }

    static async getUserAvailability(id: number) {
        return await db.query.usersAvailability.findFirst({
            where: { id },
        });
    }

    static async updateUserAvailability(userId: number, dayOfWeek: number, startTime: Date, endTime: Date) {
        const updatedUserAvailability = await db.update(usersAvailability).set({ dayOfWeek, startTime, endTime }).where(eq(usersAvailability.userId, userId)).returning();
        return updatedUserAvailability[0];
    }
}

export default UserAvailabilityController;