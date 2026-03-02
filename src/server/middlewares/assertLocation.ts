import { createMiddleware } from "hono/factory";
import { locations } from "@/server/db/schema";
import { getFormattedUsersWithBulletPoints, getQualifiedUsersForShift } from "../utils/qualifiedList";

type Location = typeof locations.$inferSelect;

export const assertLocationMiddleware = createMiddleware<{
    Variables: {
        shiftLocationId: number | null;
        probeUserLocations: Location[];
        shiftId: number | null;
    };
}>(async (c, next) => {
    const shiftLocationId = c.get("shiftLocationId");
    const shiftId = c.get("shiftId");
    const probeUserLocations = c.get("probeUserLocations");
    const qualifiedUsers = await getQualifiedUsersForShift(Number(shiftId));
    if (!shiftLocationId || !probeUserLocations.some((loc) => loc.id === shiftLocationId)) {
        const qualifiedSection = getFormattedUsersWithBulletPoints(qualifiedUsers, "Qualified users:");
        return c.json(
            { error: qualifiedSection ? `User is not assigned to this location.\n${qualifiedSection}` : "User is not assigned to this location." },
            400
        );
    }

    await next();
});
