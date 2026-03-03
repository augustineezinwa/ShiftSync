import EventEmitter from "events";
import { SWAP_REQUEST_NEEDING_APPROVAL } from "../events";
import NotificationController from "../controllers/NotificationController";
import UserController from "../controllers/UserController";
import { db } from "../db";
import RequestController from "../controllers/RequestController";

export default class SwapRequestPendingApprovalListener {

    static subscribe(event: EventEmitter) {
        event.on(SWAP_REQUEST_NEEDING_APPROVAL, handleSwapRequestPendingApproval);
    }

}

function handleSwapRequestPendingApproval({ userId }: { userId: number }) {
    console.log(`Staff availability changed for user ${userId}`);

    void (async () => {
        const requests = await RequestController.getPendingRequests(userId);
        const user = await UserController.getUser(userId);

        const title = `You have a swap request pending approval from ${user?.name}`;

        const message = `Please check your requests for updates`;
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
        await NotificationController.createBulkNotifications(managerIds.map(managerId => ({ userId: managerId, title, message, type: 'swap_request_needing_manager_approval' })));
    })();
}