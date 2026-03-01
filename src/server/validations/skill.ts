import z from "zod";

export const createSkillSchema = z.object({
    name: z.string().min(1),
    isVerified: z.boolean().optional().default(false),
});

export const updateSkillSchema = z.object({
    name: z.string().min(1),
    isVerified: z.boolean(),
});

export const assignSkillToUserSchema = z.object({
    userId: z.number(),
    skillId: z.number(),
});

export const assignSkillToMeSchema = z.object({
    skillId: z.number(),
});