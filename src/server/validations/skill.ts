import z from "zod";

export const createSkillSchema = z.object({
    name: z.string().min(1),
});

export const updateSkillSchema = z.object({
    name: z.string().min(1),
});

export const assignSkillToUserSchema = z.object({
    userId: z.number(),
    skillId: z.number(),
});