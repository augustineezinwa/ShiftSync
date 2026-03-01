import z from "zod";

export const createUserAvailabilitySchema = z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
});

export const updateUserAvailabilitySchema = z.object({
    userId: z.number(),
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
});