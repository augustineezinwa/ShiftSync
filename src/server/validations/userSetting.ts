import { z } from "zod";

export const createUserWeeklyHoursSchema = z.object({
    hoursPerWeek: z.number().min(1).max(168).default(40),
});

export const updateUserWeeklyHoursSchema = z.object({
    hoursPerWeek: z.number().min(1).max(168).default(40),
});