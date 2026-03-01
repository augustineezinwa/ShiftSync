import { zValidator } from "@hono/zod-validator";
import { ZodSchema, z } from "zod";

export const validate = <T extends ZodSchema>(schema: T) =>
    zValidator("json", schema, (result) => {
        if (!result.success) {
            throw result.error;
        }
    });