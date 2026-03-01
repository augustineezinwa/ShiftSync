
import { createMiddleware } from 'hono/factory'
import { db } from '@/server/db'
import { locations } from '@/server/db/schema';

type Location = typeof locations.$inferSelect;

export const allowOnlyManagerMiddleware = createMiddleware<{
    Variables: {
        db: typeof db
        userId: number,
        role: string
        locations: Location[]
    }
}>(async (c, next) => {
    const role = c.get("role");
    if (role !== "manager") {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const method = c.req.method;
    if (method === "POST" || method === "PUT") {
        const body = await c.req.json().catch(() => ({}));
        const locationId = body?.locationId;
        if (locationId != null) {
            const locations = c.get("locations");
            if (!locations?.some((loc) => loc.id === locationId)) {
                return c.json({ error: 'Unauthorized' }, 401);
            }
        }
    }
    await next();
})