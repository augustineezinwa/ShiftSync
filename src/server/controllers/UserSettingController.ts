import { usersSettings } from "@/server/db/schema";
import { db } from "@/server/db";
import { eq } from "drizzle-orm";

class UserSettingController {

    static async getUserSettingByUserId(userId: number) {
        return await db.query.usersSettings.findFirst({
            where: { userId },
        });
    }

    static async createUserSetting(userId: number, hoursPerWeek: number) {
        const [userSetting] = await db.insert(usersSettings).values({ userId, hoursPerWeek }).returning();
        return userSetting;
    }

    static async updateUserSetting(userId: number, hoursPerWeek: number) {
        const [userSetting] = await db.update(usersSettings).set({ hoursPerWeek }).where(eq(usersSettings.userId, userId)).returning();
        if (!userSetting) return this.createUserSetting(userId, hoursPerWeek);
        return userSetting;
    }



}

export default UserSettingController;