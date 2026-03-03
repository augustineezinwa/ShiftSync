import EventEmitter from "events";
import { NEW_SHIFT_ASSIGNED } from "../events";

export default class ShiftAssignedListener {
    
    static subscribe(event: EventEmitter) {
        event.on(NEW_SHIFT_ASSIGNED, handleShiftAssigned);
    }

    
}

function handleShiftAssigned( { userId, shiftId }: { userId: number, shiftId: number }) { 
    console.log(`Shift ${shiftId} assigned to user ${userId}`);

    void (async () => {
        
    })();

}