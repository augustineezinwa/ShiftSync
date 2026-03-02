import { createMiddleware } from "hono/factory";
import { skills } from "@/server/db/schema";
import { getFormattedUsersWithBulletPoints, getQualifiedUsersForShift } from "../utils/qualifiedList";

type Skill = typeof skills.$inferSelect;

export const assertSkillsMiddleware = createMiddleware<{
    Variables: {
        shiftSkillId: number | null;
        probeUserSkills: Skill[];
        shiftId: number | null;
    };
}>(async (c, next) => {

    const shiftSkillId = c.get("shiftSkillId");
    const shiftId = c.get("shiftId");
    const probeUserSkills = c.get("probeUserSkills");
    const qualifiedUsers = await getQualifiedUsersForShift(Number(shiftId));
    if (!shiftSkillId || !probeUserSkills.some((skill) => skill.id === shiftSkillId)) {
        return c.json({ error: `User doesn't have required skills: ${getFormattedUsersWithBulletPoints(qualifiedUsers, "Qualified users:")}` }, 400);
    }

    await next();
});