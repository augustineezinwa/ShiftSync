import { db } from "@/server/db";
import { eq } from "drizzle-orm";
import { config } from "@/server/db/schema";


class ConfigController {
    static async getConfig(key: string) {
        return await db.query.config.findFirst({
            where: { key },
        });
    }

    static async updateConfig(key: string, value: number) {
        const updatedConfig = await db.update(config).set({ value }).where(eq(config.key, key)).returning();
        return updatedConfig[0];
    }

    static async createConfig(key: string, value: number) {
        const newConfig = await db.insert(config).values({ key, value }).returning();
        return newConfig[0];
    }
}

export default ConfigController;

