import { createMiddleware } from "hono/factory";
import { db } from "@/server/db";
import { locations } from "@/server/db/schema";
import RequestController from "../controllers/RequestController";

type Location = typeof locations.$inferSelect;

export const validateRequestWriteMiddleware = createMiddleware<{
  Variables: {
    db: typeof db;
    userId: number;
    role: string;
    locations: Location[];
  };
}>(async (c, next) => {
  const id = Number(c.req.param("id"));
  if (Number.isNaN(id)) return c.json({ error: "Invalid id" }, 400);
  const request = await RequestController.getRequest(id);
  if (!request) return c.json({ error: "Request not found" }, 404);

  const userId = c.get("userId");
  const role = c.get("role");
  const body = await c.req.json().catch(() => ({})) as { status?: string };
  const newStatus = body?.status;
  if (!newStatus) return c.json({ error: "status is required" }, 400);

  if (role === "manager") {
    if (request.status !== "pending_manager_approval") {
      return c.json({ error: "Only requests pending manager approval can be approved or rejected" }, 400);
    }
    if (newStatus !== "accepted" && newStatus !== "rejected") {
      return c.json({ error: "Manager can only set status to accepted or rejected" }, 400);
    }
    await next();
    return;
  }

  if (request.requesterId !== userId && request.targetUserId !== userId) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (request.requesterId === userId) {
    if (request.status !== "pending") {
      return c.json({ error: "Only pending requests can be cancelled by the requester" }, 400);
    }
    if (newStatus !== "cancelled") {
      return c.json({ error: "Requester can only cancel (set status to cancelled)" }, 400);
    }
    await next();
    return;
  }

  if (request.targetUserId === userId) {
    if (request.status !== "pending") {
      return c.json({ error: "Only pending requests can be accepted or rejected by the receiver" }, 400);
    }
    if (newStatus !== "pending_manager_approval" && newStatus !== "rejected") {
      return c.json({ error: "Receiver can only accept or reject" }, 400);
    }
    await next();
    return;
  }

  return c.json({ error: "Unauthorized" }, 401);
});
