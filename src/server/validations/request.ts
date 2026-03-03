import z from "zod";


export const createRequestSchema = z.object({
    type: z.enum(["swap", "drop"]),
    userShiftId: z.number(),
    targetUserId: z.number().optional(),
    requesterId: z.number(),
    receiverShiftId: z.number().optional(),
});


export const updateRequestStatusSchema = z.object({
    status: z.enum(["pending", "pending_manager_approval", "accepted", "rejected", "cancelled"]),
});
