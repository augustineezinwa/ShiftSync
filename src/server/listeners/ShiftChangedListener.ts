import EventEmitter from "events";
import { NEW_SHIFT_ASSIGNED, SHIFT_CHANGED } from "../events";
import NotificationController from "../controllers/NotificationController";
import ShiftController from "../controllers/ShiftController";
import { formatShiftDateInTz, formatShiftTimeInTz } from "@/lib/shift-utils";
import { formatTimeInTz } from "../utils/timezone";

export default class ShiftChangedListener {

    static subscribe(event: EventEmitter) {
        event.on(SHIFT_CHANGED, handleShiftChanged);
    }

}

function handleShiftChanged({ userIds, shiftId }: { userIds: number[], shiftId: number }) {
    console.log(`Shift ${shiftId} changed`);

    let userIdsToNotify = userIds || []

    void (async () => {
        const shift = await ShiftController.getShift(shiftId);
        const title = 'Your Shift has been changed';

        if (userIdsToNotify.length === 0) {
            userIdsToNotify = shift?.users.map(user => user.id) ?? [];
        }

        const message = `Your manager made some updates to the shift. Please check your shift details. The shift is from ${formatTimeInTz(
            new Date(shift?.startTime ?? ''),
            shift?.location?.timezone ?? 'UTC'
        )} to ${formatTimeInTz(new Date(shift?.endTime ?? ''), shift?.location?.timezone ?? 'UTC')}.`;

        await NotificationController.createBulkNotifications(userIdsToNotify.map(userId => ({ userId, title, message, type: 'shift_changed' })));
    })();

}