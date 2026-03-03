import EventEmitter from "events";
import { STAFF_AVAILABILITY_CHANGED } from "../events";
import NotificationController from "../controllers/NotificationController";
import UserController from "../controllers/UserController";
import { db } from "../db";

export default class StaffAvailabilityListener {

    static subscribe(event: EventEmitter) {
        event.on(STAFF_AVAILABILITY_CHANGED, handleStaffAvailabilityChanged);
    }

}

function handleStaffAvailabilityChanged({ userId }: { userId: number }) {
    console.log(`Staff availability changed for user ${userId}`);

    void (async () => {
        const user = await UserController.getUser(userId);

        const title = `Your staff ${user?.name} has updated their availability`;
        const message = `Please check their availability for updates`;
        const locationIds = user?.locations.map(location => location.id) ?? [];
        const managers = await db.query.users.findMany({
            where: {
                locations: {
                    id: { in: locationIds }
                },
                role: 'manager'
            }
        });
        const managerIds = managers.map(manager => manager.id);
        await NotificationController.createBulkNotifications(managerIds.map(managerId => ({ userId: managerId, title, message, type: 'availability_change' })));
    })();
}