import { createMiddleware } from "hono/factory";
import ConfigController from "@/server/controllers/ConfigController";
import ShiftController from "@/server/controllers/ShiftController";
import RequestController from "../controllers/RequestController";

const NUMBER_OF_PENDING_REQUESTS = 3


export const enforceLimitOnRequestMiddleware = createMiddleware(async (c, next) => {

    const pendingRequests = await RequestController.getPendingRequests(c.get("userId"));
    if (pendingRequests.length >= NUMBER_OF_PENDING_REQUESTS) {
        return c.json({ error: "You have reached the maximum number of pending requests" }, 400);
    }
    return next();
});