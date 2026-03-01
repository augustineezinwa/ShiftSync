ALTER TABLE "locations" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "is_verified" boolean DEFAULT false NOT NULL;