import { createMiddleware } from "hono/factory";
import ConfigController from "@/server/controllers/ConfigController";
import ShiftController from "@/server/controllers/ShiftController";

const CUT_OFF_CONFIG_KEY = "cut-off";
const DEFAULT_CUT_OFF_HOURS = 48;
const MS_PER_HOUR = 60 * 60 * 1000;



/**
 * Enforces that the earliest shift in the given ids starts at least cut-off hours after publish time.
 * Uses ConfigController.getConfig('cut-off') for the cut-off value (in hours).
 * Must run after zValidator("json", publishShiftSchema) so c.req.valid("json") is available.
 */
export const enforceLimitMiddleware = createMiddleware(async (c, next) => {
    const body = (c.req as unknown as { valid: (key: string) => { ids?: number[] } }).valid("json");
    const ids = body?.ids;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return next();
    }

    const config = await ConfigController.getConfig(CUT_OFF_CONFIG_KEY);
    const cutOffHours = typeof config?.value === "number" ? config.value : DEFAULT_CUT_OFF_HOURS;

    const earliestStart = await ShiftController.getEarliestShiftStart(ids);
    if (!earliestStart) {
        return next();
    }

    const publishTime = new Date();
    const minStartTime = earliestStart.getTime();
    const cutoffTime = publishTime.getTime() + cutOffHours * MS_PER_HOUR;

    if (minStartTime < cutoffTime) {
        return c.json(
            {
                error: `Schedule cannot be published: earliest shift starts within the ${cutOffHours}h cut-off. Publish at least ${cutOffHours} hours before the first shift.`,
            },
            400
        );
    }

    return next();
});