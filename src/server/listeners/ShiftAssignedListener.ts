import EventEmitter from "events";
import { NEW_SHIFT_ASSIGNED } from "../events";
import NotificationController from "../controllers/NotificationController";
import ShiftController from "../controllers/ShiftController";
import { formatShiftDateInTz, formatShiftTimeInTz } from "@/lib/shift-utils";
import { formatTimeInTz } from "../utils/timezone";

export default class ShiftAssignedListener {

    static subscribe(event: EventEmitter) {
        event.on(NEW_SHIFT_ASSIGNED, handleShiftAssigned);
    }

}

function handleShiftAssigned({ userIds, shiftId }: { userIds: number[], shiftId: number }) {
    console.log(`Shift ${shiftId} assigned to user ${userIds.join(', ')}`);

    void (async () => {
        const shift = await ShiftController.getShift(shiftId);
        const title = 'Shift is Assigned to you';

        const message = `Your manager assigned you to this shift from ${formatTimeInTz(
            new Date(shift?.startTime ?? ''),
            shift?.location?.timezone ?? 'UTC'
        )} to ${formatTimeInTz(new Date(shift?.endTime ?? ''), shift?.location?.timezone ?? 'UTC')}.`;
        await NotificationController.createBulkNotifications(userIds.map(userId => ({ userId, title, message, type: 'shift_assigned' })));
    })();

}