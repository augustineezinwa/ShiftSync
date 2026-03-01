import { z } from "zod";

const MAX_SHIFT_HOURS = 12;
const MS_PER_HOUR = 60 * 60 * 1000;

export const createShiftSchema = z
    .object({
        locationId: z.number(),
        skillId: z.number(),
        startTime: z.coerce.date(),
        endTime: z.coerce.date(),
        headcount: z.number(),
    })
    .superRefine((data, ctx) => {
        if (data.endTime <= data.startTime) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End time must be after start time", path: ["endTime"] });
            return;
        }
        const hours = (data.endTime.getTime() - data.startTime.getTime()) / MS_PER_HOUR;
        if (hours > MAX_SHIFT_HOURS) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Shift duration cannot be more than 12 hours", path: ["endTime"] });
        }
    });

export const updateShiftSchema = z
    .object({
        locationId: z.number(),
        skillId: z.number(),
        startTime: z.coerce.date(),
        endTime: z.coerce.date(),
        headcount: z.number(),
    })
    .superRefine((data, ctx) => {
        if (data.endTime <= data.startTime) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "End time must be after start time", path: ["endTime"] });
            return;
        }
        const hours = (data.endTime.getTime() - data.startTime.getTime()) / MS_PER_HOUR;
        if (hours > MAX_SHIFT_HOURS) {
            ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Shift duration cannot be more than 12 hours", path: ["endTime"] });
        }
    });


export const publishShiftSchema = z.object({
    ids: z.array(z.number()),
});