import { createMiddleware } from "hono/factory";

export const validateTimeMiddleware = createMiddleware<{
    Variables: {
        location: { id: number; name: string; timezone: string; offset: number; isVerified: boolean };
        timezone: string;
        offset: number;
        startTimeLocal: Date;
        endTimeLocal: Date;
    };
}>(async (c, next) => {
    const startTime = c.get("startTimeLocal");
    const endTime = c.get("endTimeLocal");

    if (!(startTime instanceof Date) || !(endTime instanceof Date)) {
        return c.json({ error: "startTime and endTime are required" }, 400);
    }

    if (endTime <= startTime) {
        return c.json({ error: "End time must be after start time" }, 400);
    }

    const durationMs = endTime.getTime() - startTime.getTime();
    if (durationMs > 12 * 60 * 60 * 1000) {
        return c.json({ error: "Shift duration cannot be more than 12 hours" }, 400);
    }

    await next();
});