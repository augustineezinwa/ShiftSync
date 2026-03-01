import UserController from "@/server/controllers/UserController";
import { HTTPException } from 'hono/http-exception'
import { db } from "@/server/db";
import { checkAuthMiddleware } from "@/server/middlewares/checkAuth";
import { createUserSchema, loginUserSchema } from "@/server/validations/user";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { deleteCookie, setCookie } from 'hono/cookie';
import { TokenExpiredError } from "jsonwebtoken";
import ConfigController from "@/server/controllers/ConfigController";
import { configSchema } from "@/server/validations/config";
import { allowOnlyAdminMiddleware } from "@/server/middlewares/allowOnlyAdmin";
import { DrizzleQueryError } from "drizzle-orm";
import { assignSkillToUserSchema, createSkillSchema } from "@/server/validations/skill";
import SkillController from "@/server/controllers/SkillController";
import { assignLocationToUserSchema, createLocationSchema } from "@/server/validations/location";
import { LocationController } from "@/server/controllers/LocationController";
import UserAvailabilityController from "@/server/controllers/UserAvailabilityController";
import { createUserAvailabilitySchema, updateUserAvailabilitySchema } from "@/server/validations/availability";

type Bindings = {
  db: typeof db
  userId: string;
  role: string;
}

const app = new Hono<{ Bindings: Bindings }>().basePath("/api");

const appRoutes = app
  .post("/users", zValidator("json", createUserSchema), checkAuthMiddleware, async (c) => {
    const { email, password, role, name } = await c.req.json();
    const user = await UserController.createUser(name, email, password, role);
    c.status(201);
    return c.json(user);
  })
  .post("/auth/login", zValidator("json", loginUserSchema), async (c) => {
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
  .get("/auth/me", checkAuthMiddleware, async (c) => {
    const userId = c.get("userId");
    const user = await UserController.getUser(userId);
    if (!user) return c.json(null, 404);
    const { password: _p, ...me } = user;
    return c.json(me);
  })
  .get("/config/:key", checkAuthMiddleware, allowOnlyAdminMiddleware, async (c) => {
    const key = c.req.param("key");
    const config = await ConfigController.getConfig(key)
    return c.json(config);
  })
  .put("/config", zValidator("json", configSchema), checkAuthMiddleware, allowOnlyAdminMiddleware, async (c) => {
    const { key, value } = await c.req.json();
    const config = await ConfigController.updateConfig(key, value);
    return c.json(config);
  })
  .post("/config", zValidator("json", configSchema), checkAuthMiddleware, allowOnlyAdminMiddleware, async (c) => {
    const { key, value } = await c.req.json();
    const config = await ConfigController.createConfig(key, value);
    c.status(201);
    return c.json(config);
  })
  .post("/skills", zValidator("json", createSkillSchema), checkAuthMiddleware, allowOnlyAdminMiddleware, async (c) => {
    const { name } = await c.req.json();
    const skill = await SkillController.createSkill(name);
    c.status(201);
    return c.json(skill);
  })
  .post("/locations", zValidator("json", createLocationSchema), checkAuthMiddleware, allowOnlyAdminMiddleware, async (c) => {
    const { name, timezone, offset } = await c.req.json();
    const location = await LocationController.createLocation(name, timezone, offset);
    c.status(201);
    return c.json(location);
  })
  .put("/location/assign-user", zValidator("json", assignLocationToUserSchema), checkAuthMiddleware, allowOnlyAdminMiddleware, async (c) => {
    const { userId, locationId } = await c.req.json();
    const location = await LocationController.assignLocationToUser(userId, locationId);
    return c.json(location);
  })
  .post("/me/availability", zValidator("json", createUserAvailabilitySchema), checkAuthMiddleware, async (c) => {
    const { dayOfWeek, startTime, endTime } = await c.req.json();
    const userId = c.get("userId");
    const userAvailability = await UserAvailabilityController.createUserAvailability(userId, dayOfWeek, startTime, endTime);
    return c.json(userAvailability);
  })
  .put("/me/availability", zValidator("json", updateUserAvailabilitySchema), checkAuthMiddleware, async (c) => {
    const { dayOfWeek, startTime, endTime } = await c.req.json();
    const userId = c.get("userId");
    const userAvailability = await UserAvailabilityController.updateUserAvailability(userId, dayOfWeek, startTime, endTime);
    return c.json(userAvailability);
  })
  .put("/me/skills", zValidator("json", assignSkillToUserSchema), checkAuthMiddleware, async (c) => {
    const { skillId } = await c.req.json();
    const userId = c.get("userId");
    const skill = await SkillController.assignSkillToUser(userId, skillId);
    return c.json(skill);
  })
  .onError(async (error, c) => {
    console.error(error);
    if (error instanceof DrizzleQueryError) {
      const errorObject = JSON.parse(JSON.stringify(error.cause))
      if (errorObject.code === '23505') {
        console.error(errorObject);
        return c.json({ error: "resource already exists" }, 409);
      }
    }
    if (error instanceof TokenExpiredError) {
      return c.json({ error: "Token expired" }, 401);
    }
    if (error instanceof HTTPException) {
      console.error(error.cause)
      return error.getResponse()
    }
    console.error(error);
    return c.json({ error: "Internal server error" }, 500);
  })

export const GET = handle(app);
export const POST = handle(app);

export type AppRoutes = typeof appRoutes;