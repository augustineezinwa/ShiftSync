import UserController from "@/server/controllers/UserController";
import { HTTPException } from 'hono/http-exception'
import { db } from "@/server/db";
import { checkAuthMiddleware } from "@/server/middlewares/checkAuth";
import { createUserSchema, loginUserSchema } from "@/server/validations/user";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { deleteCookie, setCookie } from 'hono/cookie';
import { TokenExpiredError } from "jsonwebtoken";
import ConfigController from "@/server/controllers/ConfigController";
import { configSchema } from "@/server/validations/config";
import { allowOnlyAdminMiddleware, allowAdminOrManagerMiddleware } from "@/server/middlewares/allowOnlyAdmin";
import { DrizzleQueryError } from "drizzle-orm";
import { assignSkillToMeSchema, assignSkillToUserSchema, createSkillSchema, updateSkillSchema } from "@/server/validations/skill";
import SkillController from "@/server/controllers/SkillController";
import { assignLocationToUserSchema, createLocationSchema, updateLocationSchema } from "@/server/validations/location";
import { LocationController } from "@/server/controllers/LocationController";
import UserAvailabilityController from "@/server/controllers/UserAvailabilityController";
import { createUserAvailabilitySchema, putAvailabilitySchema, updateUserAvailabilitySchema } from "@/server/validations/availability";
import { updateUserWeeklyHoursSchema } from "@/server/validations/userSetting";
import UserSettingController from "@/server/controllers/UserSettingController";
import { allowOnlyManagerMiddleware } from "@/server/middlewares/allowOnlyManager";
import ShiftController from "@/server/controllers/ShiftController";
import { enforceLimitMiddleware } from "@/server/middlewares/enforceLimit";
import { createShiftSchema, parseAndValidateShiftTimes, publishShiftSchema, updateShiftSchema } from "@/server/validations/shift";
import { attachLocationMiddleware } from "@/server/middlewares/attachLocation";
import { ZodError } from "zod";
import { validate } from "@/server/validations/utils";
import { parseToLocalTimeMiddleware } from "@/server/middlewares/parseToLocalTime";
import { validateTimeMiddleware } from "@/server/middlewares/validateTime";
import { attachUserProbeMiddleware } from "@/server/middlewares/attachUserProbe";
import { attachShiftMiddleware } from "@/server/middlewares/attachShift";
import { assertSkillsMiddleware } from "@/server/middlewares/assertSkills";
import { assertLocationMiddleware } from "@/server/middlewares/assertLocation";
import { assertAvailabilityMiddleware } from "@/server/middlewares/assertAvailability";
import { assertMinHoursBetweenShiftsMiddleware } from "@/server/middlewares/assertMinHoursBetweenShifts";
import { checkDoubleBookingMiddleware } from "@/server/middlewares/checkDoubleBooking";
import { createRequestSchema, updateRequestStatusSchema } from "@/server/validations/request";
import RequestController from "@/server/controllers/RequestController";
import { validateRequestWriteMiddleware } from "@/server/middlewares/validateRequestWrite";
import { enforceLimitOnRequestMiddleware } from "@/server/middlewares/enforceLimitOnRequest";
import NotificationController from "@/server/controllers/NotificationController";
import DutyController from "@/server/controllers/DutyController";
import { createDutySchema } from "@/server/validations/duty";

type Bindings = {
  db: typeof db
  userId: string;
  role: string;
}

const app = new Hono<{ Bindings: Bindings }>().basePath("/api");

const appRoutes = app
  .post("/users", validate(createUserSchema), checkAuthMiddleware, async (c) => {
    const { email, password, role, name } = await c.req.json();
    const user = await UserController.createUser(name, email, password, role);
    c.status(201);
    return c.json(user);
  })
  .post("/auth/login", validate(loginUserSchema), async (c) => {
    const { email, password } = await c.req.json();
    const result = await UserController.loginUser(email, password);
    if (!result) {
      return c.json({ error: "Invalid email or password" }, 401);
    }
    c.status(200);
    const isProduction = process.env.NODE_ENV === "production";
    setCookie(c, "token", result?.token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: "strict",
    });
    return c.json(result);
  })
  .post("/auth/logout", async (c) => {
    deleteCookie(c, "token", { path: "/" });
    return c.json({ ok: true });
  })
  .get("/users", checkAuthMiddleware, allowAdminOrManagerMiddleware, async (c) => {
    const list = await UserController.getAllUsers();
    return c.json(list);
  })
  .get("/auth/me", checkAuthMiddleware, async (c) => {
    const userId = c.get("userId");
    const user = await UserController.getUser(userId);
    if (!user) return c.json(null, 404);
    const { password: _p, ...me } = user;
    return c.json(me);
  })
  .get("/config", checkAuthMiddleware, allowOnlyAdminMiddleware, async (c) => {
    const list = await ConfigController.getAllConfigs();
    return c.json(list);
  })
  .get("/config/:key", checkAuthMiddleware, allowOnlyAdminMiddleware, async (c) => {
    const key = c.req.param("key");
    const config = await ConfigController.getConfig(key)
    return c.json(config);
  })
  .put("/config", validate(configSchema), checkAuthMiddleware, allowOnlyAdminMiddleware, async (c) => {
    const { key, value } = await c.req.json();
    const config = await ConfigController.updateConfig(key, value);
    return c.json(config);
  })
  .post("/config", validate(configSchema), checkAuthMiddleware, allowOnlyAdminMiddleware, async (c) => {
    const { key, value } = await c.req.json();
    const config = await ConfigController.createConfig(key, value);
    c.status(201);
    return c.json(config);
  })
  .get("/skills", checkAuthMiddleware, async (c) => {
    const list = await SkillController.getAllSkills();
    return c.json(list);
  })
  .post("/skills", validate(createSkillSchema), checkAuthMiddleware, allowOnlyAdminMiddleware, async (c) => {
    const { name, isVerified } = await c.req.json();
    const skill = await SkillController.createSkill(name, isVerified ?? false);
    c.status(201);
    return c.json(skill);
  })
  .put("/skills/:id", validate(updateSkillSchema), checkAuthMiddleware, allowOnlyAdminMiddleware, async (c) => {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);
    const { name, isVerified } = await c.req.json();
    const skill = await SkillController.updateSkill(id, name, isVerified);
    if (!skill) return c.json({ error: "Skill not found" }, 404);
    return c.json(skill);
  })
  .get("/locations", checkAuthMiddleware, allowOnlyAdminMiddleware, async (c) => {
    const list = await LocationController.getAllLocations();
    return c.json(list);
  })
  .post("/locations", validate(createLocationSchema), checkAuthMiddleware, allowOnlyAdminMiddleware, async (c) => {
    const { name, timezone, offset, isVerified } = await c.req.json();
    const location = await LocationController.createLocation(name, timezone, offset, isVerified ?? false);
    c.status(201);
    return c.json(location);
  })
  .put("/locations/:id", validate(updateLocationSchema), checkAuthMiddleware, allowOnlyAdminMiddleware, async (c) => {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);
    const { name, timezone, offset, isVerified } = await c.req.json();
    const location = await LocationController.updateLocation(id, name, timezone, offset, isVerified);
    if (!location) return c.json({ error: "Location not found" }, 404);
    return c.json(location);
  })
  .put("/location/assign-user", validate(assignLocationToUserSchema), checkAuthMiddleware, allowOnlyAdminMiddleware, async (c) => {
    const { userId, locationId } = await c.req.json();
    const location = await LocationController.assignLocationToUser(userId, locationId);
    return c.json(location);
  })
  .put("/location/unassign-user", validate(assignLocationToUserSchema), checkAuthMiddleware, allowOnlyAdminMiddleware, async (c) => {
    const { userId, locationId } = await c.req.json();
    const location = await LocationController.unassignLocationFromUser(userId, locationId);
    return c.json(location);
  })
  .get("/me/notifications", checkAuthMiddleware, async (c) => {
    const userId = c.get("userId");
    const notifications = await NotificationController.getNotifications(userId);
    return c.json(notifications);
  })
  .put("/me/notifications/:id", checkAuthMiddleware, async (c) => {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);
    const notification = await NotificationController.updateNotification(id);
    return c.json(notification);
  })
  .get("/duties", checkAuthMiddleware, async (c) => {
    const userId = c.get("userId");
    const duties = await DutyController.getMyDuties(userId);
    return c.json(duties);
  })
  .get("/duties/live", checkAuthMiddleware, allowOnlyAdminMiddleware, async (c) => {
    const locationIds = c.get("locations").map((l) => l.id);
    const duties = await DutyController.getLiveDutiesByLocations(locationIds);
    return c.json(duties);
  })
  .post("/duties", validate(createDutySchema), checkAuthMiddleware, async (c) => {
    const { shiftId } = c.req.valid("json");
    const userId = c.get("userId");
    const duty = await DutyController.createDuty(userId, shiftId);
    if (!duty) return c.json({ error: "Shift assignment not found or already clocked in" }, 400);
    return c.json(duty);
  })
  .post("/me/availability", validate(createUserAvailabilitySchema), checkAuthMiddleware, async (c) => {
    const { dayOfWeek, startTime, endTime } = await c.req.json();
    const userId = c.get("userId");
    const userAvailability = await UserAvailabilityController.createUserAvailability(userId, dayOfWeek, startTime, endTime);
    return c.json(userAvailability);
  })
  .get("/me/availability", checkAuthMiddleware, async (c) => {
    const userId = c.get("userId");
    const list = await UserAvailabilityController.getUserAvailabilities(userId);
    return c.json({ availability: list });
  })
  .put("/me/availability", validate(putAvailabilitySchema), checkAuthMiddleware, async (c) => {
    const { availability } = c.req.valid("json");
    const userId = c.get("userId");
    const list = await UserAvailabilityController.replaceUserAvailabilities(userId, availability);
    return c.json({ availability: list });
  })
  .put("/me/weekly-hours", validate(updateUserWeeklyHoursSchema), checkAuthMiddleware, async (c) => {
    const { hoursPerWeek } = await c.req.json();
    const userId = c.get("userId");
    const userWeeklyHours = await UserSettingController.updateUserSetting(userId, hoursPerWeek);
    return c.json(userWeeklyHours);
  })
  .get("/me/weekly-hours", checkAuthMiddleware, async (c) => {
    const userId = c.get("userId");
    const userWeeklyHours = await UserSettingController.getUserSettingByUserId(userId);
    return c.json(userWeeklyHours);
  })
  .put("/user/assign-skill", validate(assignSkillToUserSchema), checkAuthMiddleware, allowOnlyAdminMiddleware, async (c) => {
    const { userId, skillId } = await c.req.json();
    const result = await SkillController.assignSkillToUser(userId, skillId);
    return c.json(result);
  })
  .put("/user/unassign-skill", validate(assignSkillToUserSchema), checkAuthMiddleware, allowOnlyAdminMiddleware, async (c) => {
    const { userId, skillId } = await c.req.json();
    const result = await SkillController.unassignSkillFromUser(userId, skillId);
    return c.json(result);
  })
  .put("/me/skills/assign", validate(assignSkillToMeSchema), checkAuthMiddleware, async (c) => {
    const { skillId } = await c.req.json();
    const userId = c.get("userId");
    const skill = await SkillController.assignSkillToUser(userId, skillId);
    return c.json(skill);
  })
  .put("/me/skills/unassign", validate(assignSkillToMeSchema), checkAuthMiddleware, async (c) => {
    const { skillId } = await c.req.json();
    const userId = c.get("userId");
    const skill = await SkillController.unassignSkillFromUser(userId, skillId);
    return c.json(skill);
  })
  .put(
    "/shifts/publish",
    validate(publishShiftSchema),
    checkAuthMiddleware,
    allowOnlyManagerMiddleware,
    enforceLimitMiddleware,
    async (c) => {
      const { ids } = c.req.valid("json");
      const list = await ShiftController.publishSchedule(ids);
      return c.json(list);
    }
  )
  .post(
    "/shifts",
    validate(createShiftSchema),
    attachLocationMiddleware,
    parseToLocalTimeMiddleware,
    validateTimeMiddleware,
    checkAuthMiddleware,
    allowOnlyManagerMiddleware,
    async (c) => {
      const { locationId, skillId, headcount } = c.req.valid("json");
      const startTime = c.get("startTimeLocal");
      const endTime = c.get("endTimeLocal");
      const shift = await ShiftController.createShift(locationId, skillId, startTime, endTime, headcount);
      return c.json(shift);
    }
  )
  .put(
    "/shifts/:id",
    validate(updateShiftSchema),
    attachLocationMiddleware,
    parseToLocalTimeMiddleware,
    validateTimeMiddleware,
    checkAuthMiddleware,
    allowOnlyManagerMiddleware,
    async (c) => {
      const id = Number(c.req.param("id"));
      if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);
      const { locationId, skillId, headcount } = c.req.valid("json");
      const startTime = c.get("startTimeLocal");
      const endTime = c.get("endTimeLocal");
      const shift = await ShiftController.updateShift(id, locationId, skillId, startTime, endTime, headcount);
      return c.json(shift);
    }
  )
  .get("/shifts", checkAuthMiddleware, allowAdminOrManagerMiddleware, async (c) => {
    const weekStart = c.req.query("weekStart");
    const weekEnd = c.req.query("weekEnd");
    const list = await ShiftController.getShifts(weekStart ?? undefined, weekEnd ?? undefined);
    return c.json(list);
  })
  .get("/shifts/overtime-costs", checkAuthMiddleware, allowOnlyManagerMiddleware, async (c) => {
    const weekStart = c.req.query("weekStart");
    const weekEnd = c.req.query("weekEnd");
    if (!weekStart || !weekEnd) return c.json({ error: "Week start and end are required" }, 400);
    const costs = await ShiftController.getOverTimeCostsForWeeklySchedule(weekStart, weekEnd);
    return c.json({ costs });
  })
  .get("/shifts/users-by-weekly-hours", checkAuthMiddleware, allowAdminOrManagerMiddleware, async (c) => {
    const weekStart = c.req.query("weekStart");
    const weekEnd = c.req.query("weekEnd");
    const locationIds = c.get("locations").map((l) => l.id);
    if (!weekStart || !weekEnd) return c.json({ error: "Week start and end are required" }, 400);
    const users = await ShiftController.getUsersByWeeklyHours(weekStart, weekEnd, locationIds);
    return c.json({ users });
  })
  .get("/shifts/fairness-analytics", checkAuthMiddleware, allowAdminOrManagerMiddleware, async (c) => {
    const weekStart = c.req.query("weekStart");
    const weekEnd = c.req.query("weekEnd");
    const locationIds = c.get("locations").map((l) => l.id);
    if (!weekStart || !weekEnd) return c.json({ error: "Week start and end are required" }, 400);
    const analytics = await ShiftController.getFairnessAnalytics(weekStart, weekEnd, locationIds);
    return c.json({ analytics });
  })
  .get("/shifts/:id", checkAuthMiddleware, allowOnlyManagerMiddleware, async (c) => {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);
    const shift = await ShiftController.getShift(id);
    return c.json(shift);
  })
  .delete("/shifts/:id", checkAuthMiddleware, allowOnlyManagerMiddleware, async (c) => {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);
    await ShiftController.deleteShift(id);
    return c.json({ ok: true });
  })
  .post("/shifts/:id/assign", checkAuthMiddleware, allowOnlyManagerMiddleware, async (c) => {
    const id = Number(c.req.param("id"));
    const { userIds } = await c.req.json();
    if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);
    const shift = await ShiftController.assignUsersToShift(id, userIds);
    return c.json(shift);
  })
  .post("/shifts/:id/unassign", checkAuthMiddleware, allowOnlyManagerMiddleware, async (c) => {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);
    const { userId } = await c.req.json();
    const shift = await ShiftController.unassignUserFromShift(id, userId);
    return c.json(shift);
  })
  .get("/me/shifts", checkAuthMiddleware, async (c) => {
    const userId = c.get("userId");
    const weekStart = c.req.query("weekStart");
    const weekEnd = c.req.query("weekEnd");
    const list = await ShiftController.getMyShifts(userId, weekStart ?? undefined, weekEnd ?? undefined);
    return c.json(list);
  })
  .get("/users/:userId/shifts/:shiftId/status", checkAuthMiddleware, allowOnlyManagerMiddleware, attachUserProbeMiddleware, attachShiftMiddleware, assertSkillsMiddleware, assertLocationMiddleware, assertAvailabilityMiddleware, assertMinHoursBetweenShiftsMiddleware, checkDoubleBookingMiddleware, async (c) => {
    const userId = Number(c.req.param("userId"));
    const shiftId = Number(c.req.param("shiftId"));
    if (Number.isNaN(userId) || Number.isNaN(shiftId)) return c.json({ error: "Invalid id" }, 400);
    const warnings = await ShiftController.getComplianceWarningsForUser(userId, shiftId);
    return c.json({ warnings, ok: true });
  })
  .get("/shifts/:shiftId/qualified-users", checkAuthMiddleware, async (c) => {
    const id = Number(c.req.param("shiftId"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);
    const users = await ShiftController.getQualifiedUsersForShift(id);
    return c.json(users);
  })
  .get("/me/shifts/qualified", checkAuthMiddleware, async (c) => {
    const userId = c.get("userId");
    const locationIds = c.get("locations").map((l) => l.id);
    const shifts = await ShiftController.getQualifiedShiftsForUser(userId, locationIds);
    return c.json(shifts);
  })
  .get("/me/shifts/external/users/:userId/qualified", checkAuthMiddleware, async (c) => {
    const userId = Number(c.req.param("userId"));
    const loggedInUserId = c.get("userId");
    if (Number.isNaN(userId)) return c.json({ error: "Invalid id" }, 400);
    const user = await UserController.getUser(userId);
    if (!user) return c.json({ error: "User not found" }, 404);
    const locationIds = user.locations.map((l) => l.id);
    const shifts = await ShiftController.getQualifiedShiftsForUser(userId, locationIds);
    const userShifts = shifts.filter((s) => s.users.some((u) => u.id === loggedInUserId));
    return c.json({ shifts: userShifts });
  })
  .post("/my/requests", validate(createRequestSchema), checkAuthMiddleware, enforceLimitOnRequestMiddleware, async (c) => {
    const { type, userShiftId, targetUserId, receiverShiftId } = c.req.valid("json");
    const requesterId = c.get("userId");
    const request = await RequestController.createRequest(requesterId, type, userShiftId, targetUserId, receiverShiftId);
    return c.json(request);
  })
  .get("/my/requests", checkAuthMiddleware, async (c) => {
    const userId = c.get("userId");
    const requests = await RequestController.getRequests(userId);
    return c.json(requests);
  })
  .get("/my/manager/requests", checkAuthMiddleware, allowOnlyManagerMiddleware, async (c) => {
    const locationIds = c.get("locations").map((l) => l.id);
    const requests = await RequestController.getRequestsForManager(locationIds);
    return c.json(requests);
  })
  .put("/my/requests/:id", validate(updateRequestStatusSchema), checkAuthMiddleware, validateRequestWriteMiddleware, async (c) => {
    const id = Number(c.req.param("id"));
    if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);
    const { status } = c.req.valid("json");
    const userId = c.get("userId");
    const request = await RequestController.updateRequestStatus(id, status, userId);
    return c.json(request);
  })
  .get("/my/pick-up-requests", checkAuthMiddleware, async (c) => {
    const userId = c.get("userId");
    const locationIds = c.get("locations").map((l) => l.id);
    const requests = await RequestController.getPickUpRequestsForUser(userId, locationIds);
    return c.json(requests);
  })
  .onError(async (error, c) => {
    console.error(error);

    if (error instanceof ZodError) {
      const formattedIssues = error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      return c.json(
        {
          error: "Validation failed",
          issues: formattedIssues,
        },
        422
      );
    }

    if (error instanceof DrizzleQueryError) {
      const errorObject = JSON.parse(JSON.stringify(error.cause));
      console.log(errorObject);
      if (errorObject.code === "23505") {
        return c.json({ error: "Resource already exists" }, 409);
      }

      if (errorObject.cause.includes("unique constraint")) {
        return c.json({ error: "Resource/Request already exists" }, 409);
      }
    }

    if (error instanceof TokenExpiredError) {
      return c.json({ error: "Token expired" }, 401);
    }

    if (error instanceof HTTPException) {
      return error.getResponse();
    }

    return c.json({ error: "Internal server error" }, 500);
  });

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);

export type AppRoutes = typeof appRoutes;