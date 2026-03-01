import { env } from '@/env';
import { Role } from '@/lib/mock-data';
import { createMiddleware } from 'hono/factory'
import { db } from '@/server/db';
import jwt from 'jsonwebtoken';
import { getCookie } from 'hono/cookie';

export const checkAuthMiddleware = createMiddleware<{
    Variables: {
        db: typeof db
        userId: number,
        role: string
    }
}>(async (c, next) => {
    const token = getCookie(c, "token");
    if (!token) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: number, role: Role };
    if (!decoded) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    const user = await db.query.users.findFirst({
        where: { id: decoded.userId },
    });
    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    c.set('userId', user.id);
    c.set('role', user.role);
    await next();
})


