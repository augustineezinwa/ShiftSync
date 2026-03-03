ALTER TABLE "notifications" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "data" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "entityId" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "notifications" ALTER COLUMN "entityType" DROP NOT NULL;