import { z } from "zod";


export const configSchema = z.object({
    key: z.string(),
    value: z.number(),
});