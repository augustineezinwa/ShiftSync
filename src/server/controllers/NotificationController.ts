import { eq } from "drizzle-orm";
import { db } from "../db";
import { notifications } from "../db/schema";

class NotificationController {

    static async createNotification(userId: number, title: string, message: string) {
        const notification = await db.insert(notifications).values({ userId, title, message }).returning();
        return notification;
    }

    static async getNotifications(userId: number) {
        const userNotifications = await db.select().from(notifications).where(eq(notifications.userId, userId));
        return userNotifications;
    }
}

export default NotificationController;