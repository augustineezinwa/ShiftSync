import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
// You can specify any property from the node-postgres connection options

const globalDb = globalThis as typeof globalThis & {
    client: ReturnType<typeof drizzle<typeof schema>>;
};

export const db =
    globalDb.client ?? drizzle({ connection: process.env.DATABASE_URL!, schema });

if (process.env.NODE_ENV !== "production") {
    globalDb.client = db;
}