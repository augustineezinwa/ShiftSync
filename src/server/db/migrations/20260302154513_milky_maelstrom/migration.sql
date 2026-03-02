ALTER TABLE "swap_requests" ADD COLUMN "shiftId" integer;--> statement-breakpoint
CREATE INDEX "swap_requests_shift_id_index" ON "swap_requests" ("shiftId");--> statement-breakpoint
ALTER TABLE "swap_requests" ADD CONSTRAINT "swap_requests_shiftId_shifts_id_fkey" FOREIGN KEY ("shiftId") REFERENCES "shifts"("id");