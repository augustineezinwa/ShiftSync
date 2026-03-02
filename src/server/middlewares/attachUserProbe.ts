import { createMiddleware } from "hono/factory";
import UserController from "../controllers/UserController";
import { skills } from "../db/schema";
import { locations } from "../db/schema";
import { usersAvailability } from "../db/schema";

type Skill = typeof skills.$inferSelect;
type Location = typeof locations.$inferSelect;
type Availability = typeof usersAvailability.$inferSelect;

export const attachUserProbeMiddleware = createMiddleware<{
    Variables: {
        probeUserId: number | null;
        probeUserSkills: Skill[];
        probeUserLocations: Location[];
        probeUserAvailabilities: Availability[];
    };
}>(async (c, next) => {
    const id = c.req.param("userId");

    if (Number.isNaN(Number(id))) {
        return c.json({ error: "Invalid id" }, 400);
    }
    const user = await UserController.getUser(Number(id));
    if (!user) {
        return c.json({ error: "User not found" }, 400);
    }
    c.set("probeUserId", Number(id));
    c.set("probeUserSkills", user.skills);
    c.set("probeUserLocations", user.locations);
    c.set("probeUserAvailabilities", user.availabilities);

    await next();
});