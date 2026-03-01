CREATE TYPE "audit_logs_action" AS ENUM('create', 'update', 'delete', 'read');--> statement-breakpoint
CREATE TYPE "notifications_type" AS ENUM('shift_assigned', 'swap_request', 'schedule_published', 'overtime_warning', 'availability_change');--> statement-breakpoint
CREATE TYPE "shifts_status" AS ENUM('draft', 'published', 'cancelled');--> statement-breakpoint
CREATE TYPE "swap_requests_status" AS ENUM('pending', 'pending_manager_approval', 'accepted', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "swap_requests_type" AS ENUM('swap', 'drop');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer,
	"action" "audit_logs_action" NOT NULL,
	"tableName" text,
	"recordId" integer,
	"oldData" jsonb,
	"newData" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "locations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"timezone" text NOT NULL,
	"offset" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "notifications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer,
	"message" text NOT NULL,
	"type" "notifications_type" NOT NULL,
	"data" jsonb NOT NULL,
	"entityId" integer NOT NULL,
	"entityType" text NOT NULL,
	"read_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "on_duty" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "on_duty_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer,
	"userShiftId" integer,
	"clock_in_at" timestamp with time zone NOT NULL,
	"clock_out_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shifts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "shifts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"locationId" integer,
	"start_time" timestamp with time zone NOT NULL,
	"end_time" timestamp with time zone NOT NULL,
	"skillId" integer,
	"headcount" integer NOT NULL,
	"status" "shifts_status" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skills" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "skills_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "swap_requests" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "swap_requests_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"requesterId" integer NOT NULL,
	"type" "swap_requests_type" NOT NULL,
	"userShiftId" integer NOT NULL,
	"targetUserId" integer,
	"status" "swap_requests_status" DEFAULT 'pending'::"swap_requests_status" NOT NULL,
	"expires_at" timestamp with time zone DEFAULT now() + interval '1 hour' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_availability" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_availability_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer,
	"dayOfWeek" integer NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_locations" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_locations_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer,
	"locationId" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_settings" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_settings_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer,
	"hoursPerWeek" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_shifts" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_shifts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer NOT NULL,
	"shiftId" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users_skills" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "users_skills_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"userId" integer,
	"skillId" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp with time zone USING "created_at"::timestamp with time zone;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone USING "updated_at"::timestamp with time zone;--> statement-breakpoint
CREATE INDEX "audit_logs_created_at_index" ON "audit_logs" ("created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_user_id_index" ON "audit_logs" ("userId");--> statement-breakpoint
CREATE INDEX "audit_logs_action_index" ON "audit_logs" ("action");--> statement-breakpoint
CREATE INDEX "notifications_created_at_index" ON "notifications" ("created_at");--> statement-breakpoint
CREATE INDEX "notifications_read_at_index" ON "notifications" ("read_at");--> statement-breakpoint
CREATE INDEX "notifications_type_index" ON "notifications" ("type");--> statement-breakpoint
CREATE INDEX "notifications_entity_id_index" ON "notifications" ("entityId");--> statement-breakpoint
CREATE INDEX "notifications_entity_type_index" ON "notifications" ("entityType");--> statement-breakpoint
CREATE INDEX "notifications_user_id_index" ON "notifications" ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "on_duty_unique" ON "on_duty" ("userId","userShiftId");--> statement-breakpoint
CREATE INDEX "on_duty_user_id_index" ON "on_duty" ("userId");--> statement-breakpoint
CREATE INDEX "on_duty_user_shift_id_index" ON "on_duty" ("userShiftId");--> statement-breakpoint
CREATE INDEX "swap_requests_expires_at_index" ON "swap_requests" ("expires_at");--> statement-breakpoint
CREATE INDEX "swap_requests_requester_id_index" ON "swap_requests" ("requesterId");--> statement-breakpoint
CREATE INDEX "swap_requests_target_user_id_index" ON "swap_requests" ("targetUserId");--> statement-breakpoint
CREATE INDEX "swap_requests_user_shift_id_index" ON "swap_requests" ("userShiftId");--> statement-breakpoint
CREATE UNIQUE INDEX "users_availability_unique" ON "users_availability" ("userId","dayOfWeek");--> statement-breakpoint
CREATE INDEX "users_availability_user_id_index" ON "users_availability" ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "users_locations_unique" ON "users_locations" ("userId","locationId");--> statement-breakpoint
CREATE INDEX "users_locations_user_id_index" ON "users_locations" ("userId");--> statement-breakpoint
CREATE INDEX "users_locations_location_id_index" ON "users_locations" ("locationId");--> statement-breakpoint
CREATE UNIQUE INDEX "users_settings_unique" ON "users_settings" ("userId");--> statement-breakpoint
CREATE INDEX "users_settings_user_id_index" ON "users_settings" ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "users_shifts_unique" ON "users_shifts" ("userId","shiftId");--> statement-breakpoint
CREATE INDEX "users_shifts_shift_id_index" ON "users_shifts" ("shiftId");--> statement-breakpoint
CREATE INDEX "users_shifts_user_id_index" ON "users_shifts" ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "users_skills_unique" ON "users_skills" ("userId","skillId");--> statement-breakpoint
CREATE INDEX "users_skills_user_id_index" ON "users_skills" ("userId");--> statement-breakpoint
CREATE INDEX "users_skills_skill_id_index" ON "users_skills" ("skillId");--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "on_duty" ADD CONSTRAINT "on_duty_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "on_duty" ADD CONSTRAINT "on_duty_userShiftId_users_shifts_id_fkey" FOREIGN KEY ("userShiftId") REFERENCES "users_shifts"("id");--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id");--> statement-breakpoint
ALTER TABLE "shifts" ADD CONSTRAINT "shifts_skillId_skills_id_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id");--> statement-breakpoint
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_requesterId_users_id_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_userShiftId_users_shifts_id_fkey" FOREIGN KEY ("userShiftId") REFERENCES "users_shifts"("id");--> statement-breakpoint
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_targetUserId_users_id_fkey" FOREIGN KEY ("targetUserId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "users_availability" ADD CONSTRAINT "users_availability_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "users_locations" ADD CONSTRAINT "users_locations_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "users_locations" ADD CONSTRAINT "users_locations_locationId_locations_id_fkey" FOREIGN KEY ("locationId") REFERENCES "locations"("id");--> statement-breakpoint
ALTER TABLE "users_settings" ADD CONSTRAINT "users_settings_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "users_shifts" ADD CONSTRAINT "users_shifts_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "users_shifts" ADD CONSTRAINT "users_shifts_shiftId_shifts_id_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id");--> statement-breakpoint
ALTER TABLE "users_skills" ADD CONSTRAINT "users_skills_userId_users_id_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id");--> statement-breakpoint
ALTER TABLE "users_skills" ADD CONSTRAINT "users_skills_skillId_skills_id_fkey" FOREIGN KEY ("skillId") REFERENCES "skills"("id");