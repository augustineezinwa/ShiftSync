import { createMiddleware } from "hono/factory";
import ShiftController from "../controllers/ShiftController";

export const attachShiftMiddleware = createMiddleware<{
    Variables: {
        shiftSkillId: number | null;
        shiftLocationId: number | null;
        shiftStartTime: Date | null;
        shiftEndTime: Date | null;
        shiftId: number | null;
        shiftTimezone: string;
    };
}>(async (c, next) => {
    const id = c.req.param("shiftId");
    if (Number.isNaN(Number(id))) {
        return c.json({ error: "Invalid id" }, 400);
    }
    const shift = await ShiftController.getShift(Number(id));
    if (!shift) {
        return c.json({ error: "Shift not found" }, 400);
    }
    const shiftSkill = shift.skill;
    const shiftLocation = shift.location;
    const shiftStartTime = shift.startTime;
    const shiftEndTime = shift.endTime;

    c.set("shiftId", Number(id));
    c.set("shiftSkillId", shiftSkill?.id ?? null);
    c.set("shiftLocationId", shiftLocation?.id ?? null);
    c.set("shiftStartTime", shiftStartTime ?? null);
    c.set("shiftEndTime", shiftEndTime ?? null);
    c.set("shiftTimezone", shiftLocation?.timezone ?? "UTC");

    await next();
});