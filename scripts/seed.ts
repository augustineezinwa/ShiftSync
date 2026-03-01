import "dotenv/config";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

async function hashPassword(password: string) {
    return await bcrypt.hash(password, SALT_ROUNDS);
}

async function seed() {
    await db.insert(users).values([
        { name: "Admin X", email: "admin@gmail.com", password: await hashPassword("password"), role: "admin" },
        { name: "Manager Y", email: "manager@gmail.com", password: await hashPassword("password"), role: "manager" },
        { name: "Staff Z", email: "staff@gmail.com", password: await hashPassword("password"), role: "staff" },
    ]);
}

seed().then(() => {
    console.log("data migrated successfully");
}).catch(console.error);
