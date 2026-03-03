import EventEmitter from "events";
import { NEW_SHIFT_ASSIGNED, SCHEDULE_PUBLISHED, SHIFT_CHANGED, SWAP_REQUEST_APPROVED, SWAP_REQUEST_UPDATED } from "../events";
import NotificationController from "../controllers/NotificationController";
import ShiftController from "../controllers/ShiftController";
import { formatShiftDateInTz, formatShiftTimeInTz } from "@/lib/shift-utils";
import { formatTimeInTz } from "../utils/timezone";
import RequestController from "../controllers/RequestController";

export default class RequestApprovedListener {

    static subscribe(event: EventEmitter) {
        event.on(SWAP_REQUEST_APPROVED, handleRequestApproved);
    }

}

function handleRequestApproved({ requestId, }: { requestId: number }) {
    console.log(`Horray ! Request ${requestId} approved`);

    void (async () => {
        const request = await RequestController.getRequest(requestId);
        const title = request?.type === 'swap' ? 'Horray ! Your swap request has been approved' : 'Horray ! Your drop request has been approved';
        const message = 'Please check your requests for updates';
        await NotificationController.createBulkNotifications([{ userId: request?.requesterId ?? 0, title, message, type: 'request_approved' }]);
    })();

}