import { z } from "zod";

export const createUserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(["admin", "manager", "staff"]),
});

export const loginUserSchema = z.object({
    email: z.string().email(),
    password: z.string()
});

