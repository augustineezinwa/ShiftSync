import { z } from "zod";
import { LocationController } from "@/server/controllers/LocationController";
import { parseLocationLocalToUtc } from "@/server/utils/timezone";

/** Location-local datetime: YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss (no Z). */
const locationLocalDatetime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?$/);

const MAX_SHIFT_HOURS = 12;
const MS_PER_HOUR = 60 * 60 * 1000;

function validateShiftTimes(startTimeUtc: Date, endTimeUtc: Date): { ok: false; error: string } | { ok: true } {
    if (endTimeUtc <= startTimeUtc) {
        return { ok: false, error: "End time must be after start time" };
    }
    const hours = (endTimeUtc.getTime() - startTimeUtc.getTime()) / MS_PER_HOUR;
    if (hours > MAX_SHIFT_HOURS) {
        return { ok: false, error: "Shift duration cannot be more than 12 hours" };
    }
    return { ok: true };
}

async function convertLocationLocalToUtc(data: {
    locationId: number;
    startTime: string;
    endTime: string;
}): Promise<{ startTime: Date; endTime: Date }> {
    const location = await LocationController.getLocation(data.locationId);
    if (!location) {
        throw new z.ZodError([
            { code: z.ZodIssueCode.custom, message: "Location not found", path: ["locationId"] },
        ]);
    }
    const startUtc = parseLocationLocalToUtc(data.startTime, location.timezone);
    const endUtc = parseLocationLocalToUtc(data.endTime, location.timezone);
    const validation = validateShiftTimes(startUtc, endUtc);
    if (!validation.ok) {
        throw new z.ZodError([
            { code: z.ZodIssueCode.custom, message: validation.error, path: ["endTime"] },
        ]);
    }
    return { startTime: startUtc, endTime: endUtc };
}

const shiftBodySchema = z.object({
    locationId: z.number(),
    skillId: z.number(),
    startTime: locationLocalDatetime,
    endTime: locationLocalDatetime,
    headcount: z.number(),
});

export const createShiftSchema = shiftBodySchema.transform(async (data) => {
    const { startTime, endTime } = await convertLocationLocalToUtc(data);
    return { ...data, startTime, endTime };
});

export const updateShiftSchema = shiftBodySchema.transform(async (data) => {
    const { startTime, endTime } = await convertLocationLocalToUtc(data);
    return { ...data, startTime, endTime };
});


export const publishShiftSchema = z.object({
    ids: z.array(z.number()),
});