import EventEmitter from "events";
import { event, NEW_SHIFT_ASSIGNED, SHIFT_CHANGED, SWAP_REQUEST_UPDATED } from "../events";
import NotificationController from "../controllers/NotificationController";
import ShiftController from "../controllers/ShiftController";
import { formatShiftDateInTz, formatShiftTimeInTz } from "@/lib/shift-utils";
import { formatTimeInTz } from "../utils/timezone";
import { swapRequests } from "../db/schema";
import { db } from "../db";
import { eq } from "drizzle-orm";

export default class ShiftChangedListener {

    static subscribe(event: EventEmitter) {
        event.on(SHIFT_CHANGED, handleShiftChanged);
    }

}

function handleShiftChanged({ userIds, shiftId, type }: { userIds: number[], shiftId: number, type?: "assign" | "unassign" }) {
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

        const updatedRequests = await db
            .update(swapRequests)
            .set({ status: "cancelled" })
            .where(eq(swapRequests.shiftId, shiftId)).returning();

        const targetUserIds = updatedRequests.map(request => request.targetUserId).filter(Boolean);
        const requesterIds = updatedRequests.map(request => request.requesterId).filter(Boolean);
        event.emit(SWAP_REQUEST_UPDATED, { targetUserIds, requesterIds });
    })();

}