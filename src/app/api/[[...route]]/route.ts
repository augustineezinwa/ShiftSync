import UserController from "@/server/controllers/UserController";
import { db } from "@/server/db";
import { checkAuthMiddleware } from "@/server/middlewares/checkAuth";
import { Hono } from "hono";
import { handle } from "hono/vercel";

type Bindings = {
  db: typeof db
  userId: string;
  role: string;
}

const app = new Hono<{ Bindings: Bindings }>().basePath("/api");

app.post("/users", checkAuthMiddleware, async (c) => {

  const { email, password, role, name } = await c.req.json();
  const user = await UserController.createUser(name, email, password, role);
  c.status(201);
  return c.json(user);
});

app.post("/auth/login", checkAuthMiddleware, async (c) => {
  const { email, password } = await c.req.json();
  const result = await UserController.loginUser(email, password);
  c.status(200);
  c.header("Set-Cookie", `token=${result?.token}; HttpOnly; Secure; SameSite=Strict`);
  return c.json(result);
});



export const GET = handle(app);
export const POST = handle(app);
