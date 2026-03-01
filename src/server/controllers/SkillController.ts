import { db } from "@/server/db";
import { skills, usersSkills } from "@/server/db/schema";
import { and, asc, eq } from "drizzle-orm";

class SkillController {
    static async createSkill(name: string, isVerified = false) {
        const [skill] = await db.insert(skills).values({ name, isVerified }).returning();
        return skill;
    }

    static async getSkill(id: number) {
        return await db.query.skills.findFirst({
            where: { id },
        });
    }

    static async updateSkill(id: number, name: string, isVerified: boolean) {
        const [updated] = await db.update(skills).set({ name, isVerified }).where(eq(skills.id, id)).returning();
        return updated;
    }

    static async deleteSkill(id: number) {
        const deletedSkill = await db.delete(skills).where(eq(skills.id, id)).returning();
        return deletedSkill[0];
    }

    static async getAllSkills() {
        return await db.select().from(skills).orderBy(skills.id);
    }

    static async assignSkillToUser(userId: number, skillId: number) {
        const assignedSkill = await db.insert(usersSkills).values({ userId, skillId }).onConflictDoNothing().returning();
        return assignedSkill[0];
    }

    static async unassignSkillFromUser(userId: number, skillId: number) {
        const unassignedSkill = await db.delete(usersSkills).where(and(eq(usersSkills.userId, userId), eq(usersSkills.skillId, skillId))).returning();
        return unassignedSkill[0];
    }
}

export default SkillController;