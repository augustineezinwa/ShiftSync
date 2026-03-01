import { sql, defineRelations } from "drizzle-orm";
import { index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const rolesEnum = pgEnum("roles", ["admin", "manager", "staff"]);

export const shiftsStatusEnum = pgEnum("shifts_status", ["draft", "published", "cancelled"]);

export const swapRequestsTypeEnum = pgEnum("swap_requests_type", ["swap", "drop"]);
export const swapRequestsStatusEnum = pgEnum("swap_requests_status", ["pending", "pending_manager_approval", "accepted", "rejected", "cancelled"]);

export const auditLogsActionEnum = pgEnum("audit_logs_action", ["create", "update", "delete", "read"]);

export const notificationsTypeEnum = pgEnum("notifications_type", ["shift_assigned", "swap_request", "schedule_published", "overtime_warning", "availability_change"]);
export const users = pgTable("users", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    email: text().notNull().unique(),
    password: text().notNull(),
    role: rolesEnum().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const locations = pgTable("locations", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    timezone: text().notNull(),
    offset: integer().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const skills = pgTable("skills", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    name: text().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersSkills = pgTable("users_skills", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().references(() => users.id),
    skillId: integer().references(() => skills.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex("users_skills_unique").on(table.userId, table.skillId),
    index("users_skills_user_id_index").on(table.userId),
    index("users_skills_skill_id_index").on(table.skillId),
]);

export const usersLocations = pgTable("users_locations", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().references(() => users.id),
    locationId: integer().references(() => locations.id),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex("users_locations_unique").on(table.userId, table.locationId),
    index("users_locations_user_id_index").on(table.userId),
    index("users_locations_location_id_index").on(table.locationId),
]);

export const usersSettings = pgTable("users_settings", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().references(() => users.id),
    hoursPerWeek: integer().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex("users_settings_unique").on(table.userId),
    index("users_settings_user_id_index").on(table.userId),
]);

export const usersAvailability = pgTable("users_availability", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().references(() => users.id),
    dayOfWeek: integer().notNull(),
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex("users_availability_unique").on(table.userId, table.dayOfWeek),
    index("users_availability_user_id_index").on(table.userId),
]);

export const shifts = pgTable("shifts", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    locationId: integer().references(() => locations.id),
    startTime: timestamp("start_time", { withTimezone: true }).notNull(),
    endTime: timestamp("end_time", { withTimezone: true }).notNull(),
    skillId: integer().references(() => skills.id),
    headcount: integer().notNull(),
    status: shiftsStatusEnum().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const usersShifts = pgTable("users_shifts", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().references(() => users.id).notNull(),
    shiftId: integer().references(() => shifts.id).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex("users_shifts_unique").on(table.userId, table.shiftId),
    index("users_shifts_shift_id_index").on(table.shiftId),
    index("users_shifts_user_id_index").on(table.userId),
]);

export const swapRequests = pgTable("swap_requests", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    requesterId: integer().references(() => users.id).notNull(),
    type: swapRequestsTypeEnum().notNull(),
    userShiftId: integer().references(() => usersShifts.id).notNull(),
    targetUserId: integer().references(() => users.id),
    status: swapRequestsStatusEnum().notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull().default(sql`now() + interval '1 hour'`),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index("swap_requests_expires_at_index").on(table.expiresAt),
    index("swap_requests_requester_id_index").on(table.requesterId),
    index("swap_requests_target_user_id_index").on(table.targetUserId),
    index("swap_requests_user_shift_id_index").on(table.userShiftId),
]);

export const onDuty = pgTable("on_duty", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().references(() => users.id),
    userShiftId: integer().references(() => usersShifts.id),
    clockInAt: timestamp("clock_in_at", { withTimezone: true }).notNull(),
    clockOutAt: timestamp("clock_out_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex("on_duty_unique").on(table.userId, table.userShiftId),
    index("on_duty_user_id_index").on(table.userId),
    index("on_duty_user_shift_id_index").on(table.userShiftId),
]);

export const auditLogs = pgTable("audit_logs", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().references(() => users.id),
    action: auditLogsActionEnum().notNull(),
    tableName: text(),
    recordId: integer(),
    oldData: jsonb(),
    newData: jsonb(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index("audit_logs_created_at_index").on(table.createdAt),
    index("audit_logs_user_id_index").on(table.userId),
    index("audit_logs_action_index").on(table.action),
]);

export const notifications = pgTable("notifications", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    userId: integer().references(() => users.id),
    message: text().notNull(),
    type: notificationsTypeEnum().notNull(),
    data: jsonb().notNull(),
    entityId: integer().notNull(),
    entityType: text().notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    index("notifications_created_at_index").on(table.createdAt),
    index("notifications_read_at_index").on(table.readAt),
    index("notifications_type_index").on(table.type),
    index("notifications_entity_id_index").on(table.entityId),
    index("notifications_entity_type_index").on(table.entityType),
    index("notifications_user_id_index").on(table.userId),
]);

export const config = pgTable("config", {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    key: text().notNull(),
    value: integer().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
    uniqueIndex("config_unique").on(table.key),
    index("config_key_index").on(table.key),
    index("config_value_index").on(table.value),
]);



/** 
 * relations
 * 
*/
export const relations = defineRelations({ users, usersLocations, usersSkills, usersSettings, locations, skills, usersAvailability, config }, (r) => ({
    users: {
        skills: r.many.skills({
            from: r.users.id.through(r.usersSkills.userId),
            to: r.skills.id.through(r.usersSkills.skillId)
        }),
        locations: r.many.locations({
            from: r.users.id.through(r.usersLocations.userId),
            to: r.locations.id.through(r.usersLocations.locationId)
        }),
        setting: r.one.usersSettings({
            from: r.users.id,
            to: r.usersSettings.userId
        }),
        availabilities: r.many.usersAvailability({
            from: r.users.id,
            to: r.usersAvailability.userId
        })
    },

    locations: {
        users: r.many.users()
    },

    skills: {
        users: r.many.users()
    },

    usersSettings: {
        user: r.one.users()
    },

    usersAvailability: {
        user: r.one.users()
    }
})
);
