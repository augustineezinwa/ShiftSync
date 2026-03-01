import { z } from "zod";
import { parseLocationLocalToUtc } from "@/server/utils/timezone";

/** Location-local datetime: YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss (no Z). */
const locationLocalDatetime = z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?$/);

const MAX_SHIFT_HOURS = 12;
const MS_PER_HOUR = 60 * 60 * 1000;

/** Validate end > start and duration <= 12h. Returns error message or null. */
export function validateShiftTimes(startTimeUtc: Date, endTimeUtc: Date): string | null {
  if (endTimeUtc <= startTimeUtc) {
    return "End time must be after start time";
  }
  const hours = (endTimeUtc.getTime() - startTimeUtc.getTime()) / MS_PER_HOUR;
  if (hours > MAX_SHIFT_HOURS) {
    return "Shift duration cannot be more than 12 hours";
  }
  return null;
}

/** Parse location-local start/end strings to UTC Dates and validate. Throws ZodError on failure. */
export function parseAndValidateShiftTimes(
  startTime: string,
  endTime: string,
  timezone: string
): { startTime: Date; endTime: Date } {
  const startUtc = parseLocationLocalToUtc(startTime, timezone);
  const endUtc = parseLocationLocalToUtc(endTime, timezone);
  const error = validateShiftTimes(startUtc, endUtc);
  if (error) {
    throw new z.ZodError([
      { code: z.ZodIssueCode.custom, message: error, path: ["endTime"] },
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

export const createShiftSchema = shiftBodySchema;
export const updateShiftSchema = shiftBodySchema;

export const publishShiftSchema = z.object({
  ids: z.array(z.number()),
});
