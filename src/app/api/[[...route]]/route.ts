import UserController from "@/server/controllers/UserController";
import { db } from "@/server/db";
import { checkAuthMiddleware } from "@/server/middlewares/checkAuth";
import { createUserSchema, loginUserSchema } from "@/server/validations/user";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { handle } from "hono/vercel";
import { deleteCookie, setCookie } from 'hono/cookie';

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
    setCookie(c, "token", result?.token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });
    return c.json(result);
  })
  .post("/auth/logout", async (c) => {
    deleteCookie(c, "token", { path: "/" });
    return c.json({ ok: true });
  });

export const GET = handle(app);
export const POST = handle(app);

export type AppRoutes = typeof appRoutes;