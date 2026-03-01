import z from "zod";

export const createLocationSchema = z.object({
    name: z.string().min(1),
    timezone: z.string().min(1),
    offset: z.number().min(0).max(24),
});

export const updateLocationSchema = z.object({
    id: z.number(),
    name: z.string().min(1),
    timezone: z.string().min(1),
    offset: z.number().min(0).max(24),
});

export const assignLocationToUserSchema = z.object({
    userId: z.number(),
    locationId: z.number(),
});