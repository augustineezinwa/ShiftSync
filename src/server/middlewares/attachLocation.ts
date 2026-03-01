import { createMiddleware } from "hono/factory";
import { LocationController } from "@/server/controllers/LocationController";

/** Expects validated JSON body with locationId. Fetches location and sets timezone + offset on context. */
export const attachLocationMiddleware = createMiddleware<{
  Variables: {
    location: { id: number; name: string; timezone: string; offset: number; isVerified: boolean };
    timezone: string;
    offset: number;
  };
}>(async (c, next) => {
  const { locationId } = await c.req.json();
  const location = await LocationController.getLocation(locationId);
  if (!location) {
    return c.json({ error: "Location not found" }, 400);
  }
  c.set("location", location);
  c.set("timezone", location.timezone);
  c.set("offset", location.offset);
  await next();
});
