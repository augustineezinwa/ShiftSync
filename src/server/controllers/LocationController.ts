import { db } from "@/server/db";
import { locations, usersLocations } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export class LocationController {
    static async createLocation(name: string, timezone: string, offset: number) {
        const location = await db.insert(locations).values({ name, timezone, offset }).returning();
        return location[0];
    }

    static async getLocation(id: number) {
        return await db.query.locations.findFirst({
            where: { id },
        });
    }

    static async updateLocation(id: number, name: string, timezone: string, offset: number) {
        const updatedLocation = await db.update(locations).set({ name, timezone, offset }).where(eq(locations.id, id)).returning();
        return updatedLocation;
    }

    static async assignLocationToUser(userId: number, locationId: number) {
        const assignedLocation = await db.insert(usersLocations).values({ userId, locationId }).onConflictDoNothing().returning();
        return assignedLocation[0];
    }
}