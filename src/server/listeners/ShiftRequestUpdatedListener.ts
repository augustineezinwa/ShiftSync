import EventEmitter from "events";
import { NEW_SHIFT_ASSIGNED, SCHEDULE_PUBLISHED, SHIFT_CHANGED, SWAP_REQUEST_UPDATED } from "../events";
import NotificationController from "../controllers/NotificationController";
import ShiftController from "../controllers/ShiftController";
import { formatShiftDateInTz, formatShiftTimeInTz } from "@/lib/shift-utils";
import { formatTimeInTz } from "../utils/timezone";
import RequestController from "../controllers/RequestController";

export default class ShiftRequestUpdatedListener {

    static subscribe(event: EventEmitter) {
        event.on(SWAP_REQUEST_UPDATED, handleShiftRequestUpdated);
    }

}

function handleShiftRequestUpdated({ targetUserIds, requesterIds, requestId }: { targetUserIds: number[], requesterIds: number[], requestId: number }) {
    console.log(`Shift request ${requestId} updated for target users ${targetUserIds} and requester users ${requesterIds}`);

    void (async () => {
        const request = await RequestController.getRequest(requestId);
        const title = request?.type === 'swap' ? 'You have updates on your swap request' : 'You have updates on your drop request';
        const message = 'Please check your requests for updates';
        const allUserIds = Array.from(new Set([...targetUserIds, ...requesterIds]));
        await NotificationController.createBulkNotifications(allUserIds.map(userId => ({ userId, title, message, type: 'request_updated' })));
    })();

}