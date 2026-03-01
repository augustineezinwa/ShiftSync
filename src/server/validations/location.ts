import z from "zod";

export const createLocationSchema = z.object({
    name: z.string().min(1),
    timezone: z.string().min(1),
    offset: z.number().min(-12).max(14),
    isVerified: z.boolean().optional().default(false),
});

export const updateLocationSchema = z.object({
    name: z.string().min(1),
    timezone: z.string().min(1),
    offset: z.number().min(-12).max(14),
    isVerified: z.boolean(),
});

export const assignLocationToUserSchema = z.object({
    userId: z.number(),
    locationId: z.number(),
});