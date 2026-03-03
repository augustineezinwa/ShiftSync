import z from "zod";

export const createDutySchema = z.object({
    shiftId: z.number().int().positive(),
});
