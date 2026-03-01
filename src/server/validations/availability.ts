import z from "zod";

export const createUserAvailabilitySchema = z.object({
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
    isActive: z.boolean(),
});

export const updateUserAvailabilitySchema = z.object({
    isActive: z.boolean(),
    dayOfWeek: z.number().min(0).max(6),
    startTime: z.string().min(1),
    endTime: z.string().min(1),
});