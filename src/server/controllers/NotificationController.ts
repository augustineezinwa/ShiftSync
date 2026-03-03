import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../db";
import { notifications, notificationsTypeEnum } from "../db/schema";

type NotificationType = (typeof notificationsTypeEnum.enumValues)[number];

class NotificationController {

    static async createNotification(userId: number, title: string, message: string, type: NotificationType) {
        const notification = await db.insert(notifications).values({ userId, title, message, type }).returning();
        return notification;
    }

    static async getNotifications(userId: number) {
        const userNotifications = await db.select().from(notifications).where(and(eq(notifications.userId, userId), isNull(notifications.readAt))).orderBy(desc(notifications.createdAt));
        return userNotifications;
    }

    static async updateNotification(notificationId: number) {
        const updatedNotification = await db.update(notifications).set({ readAt: new Date() }).where(eq(notifications.id, notificationId)).returning();
        return updatedNotification;
    }

    static async deleteNotification(notificationId: number) {
        const deletedNotification = await db.delete(notifications).where(eq(notifications.id, notificationId)).returning();
        return deletedNotification;
    }

    static async createBulkNotifications(notificationsData: { userId: number, title: string, message: string, type: NotificationType }[]) {
        const createdNotifications = await db.insert(notifications).values(notificationsData.map(notification => ({
            userId: notification.userId,
            title: notification.title,
            message: notification.message,
            type: notification.type,
        }))).returning({ id: notifications.id }).onConflictDoNothing();
        return createdNotifications;
    }
}

export default NotificationController;