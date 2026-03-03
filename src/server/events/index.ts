import EventEmitter from "events";

import ShiftAssignedListener from "../listeners/ShiftAssignedListener";
import SwapRequestPendingApprovalListener from "../listeners/SwapRequestPendingApprovalListener";
import ShiftChangedListener from "../listeners/ShiftChangedListener";
import ShiftRequestUpdatedListener from "../listeners/ShiftRequestUpdatedListener";
import StaffAvailabilityListener from "../listeners/StaffAvailabilityListener";
import RequestApprovedListener from "../listeners/RequestApprovedListener";

//staffs
//new shifts assigned, shift changes, swap request updates, schedule published 

//managers
//swap/drop requests needing approval, overtime warnings, staff availability changes

export const event = new EventEmitter();



const NEW_SHIFT_ASSIGNED = "new_shift_assigned";
const SHIFT_CHANGED = "shift_updated";
const SWAP_REQUEST_UPDATED = "swap_request_updated";
const SCHEDULE_PUBLISHED = "schedule_published";

const SWAP_REQUEST_NEEDING_APPROVAL = "swap_request_needing_approval";
const OVERTIME_WARNING = "overtime_warning";
const STAFF_AVAILABILITY_CHANGED = "staff_availability_changed";

const SWAP_REQUEST_APPROVED = "swap_request_approved";

RequestApprovedListener.subscribe(event);
ShiftAssignedListener.subscribe(event);
ShiftChangedListener.subscribe(event);
ShiftRequestUpdatedListener.subscribe(event);
SwapRequestPendingApprovalListener.subscribe(event);
StaffAvailabilityListener.subscribe(event);
SwapRequestPendingApprovalListener.subscribe(event);


export {
    NEW_SHIFT_ASSIGNED,
    SHIFT_CHANGED,
    SWAP_REQUEST_UPDATED,
    SCHEDULE_PUBLISHED,
    SWAP_REQUEST_NEEDING_APPROVAL,
    OVERTIME_WARNING,
    STAFF_AVAILABILITY_CHANGED,
    SWAP_REQUEST_APPROVED
}

