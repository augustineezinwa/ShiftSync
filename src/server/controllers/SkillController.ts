import { db } from "@/server/db";
import { skills, usersSkills } from "@/server/db/schema";
import { eq } from "drizzle-orm";

class SkillController {
    static async createSkill(name: string) {
        const skill = await db.insert(skills).values({ name }).returning();
        return skill[0];
    }

    static async getSkill(id: number) {
        return await db.query.skills.findFirst({
            where: { id },
        });
    }

    static async updateSkill(id: number, name: string) {
        const updatedSkill = await db.update(skills).set({ name }).where(eq(skills.id, id)).returning();
        return updatedSkill[0];
    }

    static async deleteSkill(id: number) {
        const deletedSkill = await db.delete(skills).where(eq(skills.id, id)).returning();
        return deletedSkill[0];
    }

    static async getAllSkills() {
        return await db.query.skills.findMany();
    }

    static async assignSkillToUser(userId: number, skillId: number) {
        const assignedSkill = await db.insert(usersSkills).values({ userId, skillId }).onConflictDoNothing().returning();
        return assignedSkill[0];
    }
}

export default SkillController;