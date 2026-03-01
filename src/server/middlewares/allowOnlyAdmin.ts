
import { createMiddleware } from 'hono/factory'

export const allowOnlyAdminMiddleware = createMiddleware(async (c, next) => {
    const role = c.get("role");
    if (role !== "admin") {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    await next();
})

export const allowAdminOrManagerMiddleware = createMiddleware(async (c, next) => {
    const role = c.get("role");
    if (role !== "admin" && role !== "manager") {
        return c.json({ error: "Unauthorized" }, 401);
    }
    await next();
})