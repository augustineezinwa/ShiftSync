import { createMiddleware } from "hono/factory";
import { parseLocationLocalToUtc } from "../utils/timezone";

export const parseToLocalTimeMiddleware = createMiddleware<{
    Variables: {
        location: { id: number; name: string; timezone: string; offset: number; isVerified: boolean };
        timezone: string;
        offset: number;
        startTimeLocal: Date;
        endTimeLocal: Date;
    };
}>(async (c, next) => {

    const { startTime, endTime } = await c.req.json();
    const timezone = c.get("timezone");
    const startTimeLocal = parseLocationLocalToUtc(startTime, timezone);
    const endTimeLocal = parseLocationLocalToUtc(endTime, timezone);
    c.set("startTimeLocal", startTimeLocal);
    c.set("endTimeLocal", endTimeLocal);
    await next();
});