import { env } from '@/env';
import { Role } from '@/lib/mock-data';
import { createMiddleware } from 'hono/factory'
import { db } from '@/server/db';
import jwt from 'jsonwebtoken';
import { getCookie } from 'hono/cookie';
import { locations, skills } from '@/server/db/schema';

type Location = typeof locations.$inferSelect;
type Skill = typeof skills.$inferSelect;


export const checkAuthMiddleware = createMiddleware<{
    Variables: {
        db: typeof db
        userId: number,
        role: string
        locations: Location[],
        skills: Skill[],
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
        with: {
            locations: true,
            skills: true,
        },
    });
    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    c.set('userId', user.id);
    c.set('role', user.role);
    c.set('locations', user.locations);
    c.set('skills', user.skills);
    await next();
})


