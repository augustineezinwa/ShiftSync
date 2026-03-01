import { db } from "@/server/db";
import { locations, usersLocations } from "@/server/db/schema";
import { asc, eq } from "drizzle-orm";

export class LocationController {
    static async createLocation(name: string, timezone: string, offset: number, isVerified = false) {
        const [location] = await db.insert(locations).values({ name, timezone, offset, isVerified }).returning();
        return location;
    }

    static async getLocation(id: number) {
        const [row] = await db.select().from(locations).where(eq(locations.id, id)).limit(1);
        return row ?? null;
    }

    static async getAllLocations() {
        return await db.select().from(locations).orderBy(asc(locations.id));
    }

    static async updateLocation(id: number, name: string, timezone: string, offset: number, isVerified: boolean) {
        const [updated] = await db.update(locations).set({ name, timezone, offset, isVerified }).where(eq(locations.id, id)).returning();
        return updated;
    }

    static async assignLocationToUser(userId: number, locationId: number) {
        const assignedLocation = await db.insert(usersLocations).values({ userId, locationId }).onConflictDoNothing().returning();
        return assignedLocation[0];
    }
}