ALTER TABLE "shifts" ALTER COLUMN "status" SET DEFAULT 'draft'::"shifts_status";--> statement-breakpoint
ALTER TABLE "swap_requests" ALTER COLUMN "userShiftId" DROP NOT NULL;