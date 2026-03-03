import EventEmitter from "events";
import { NEW_SHIFT_ASSIGNED, SCHEDULE_PUBLISHED, SHIFT_CHANGED } from "../events";
import NotificationController from "../controllers/NotificationController";
import ShiftController from "../controllers/ShiftController";
import { formatShiftDateInTz, formatShiftTimeInTz } from "@/lib/shift-utils";
import { formatTimeInTz } from "../utils/timezone";

export default class ShiftPublishedListener {

    static subscribe(event: EventEmitter) {
        event.on(SCHEDULE_PUBLISHED, handleShiftPublished);
    }

}

function handleShiftPublished({ shiftIds }: { shiftIds: number[] }) {
    console.log(`Schedule ${shiftIds.join(', ')} published`);

    void (async () => {
        const shifts = await ShiftController.getShiftsByIds(shiftIds);

        const userIds = shifts.flatMap(shift => shift.users.map(user => user.id));
        const uniqueUserIds = Array.from(new Set(userIds));
        const title = 'Schedule has been published';

        const message = 'Your manager has published the schedule for the week. Please check your shifts.';
        await NotificationController.createBulkNotifications(uniqueUserIds.map(userId => ({ userId, title, message, type: 'schedule_published' })));
    })();

}