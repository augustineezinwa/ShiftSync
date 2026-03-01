import { env } from "@/env";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { relations } from "./schema";
// You can specify any property from the node-postgres connection options

const globalDb = globalThis as typeof globalThis & {
    client: ReturnType<typeof drizzle<typeof schema, typeof relations>>;
};

export const db =
    globalDb.client ?? drizzle({ connection: env.DATABASE_URL, schema, relations });

if (env.NODE_ENV !== "production") {
    globalDb.client = db;
}