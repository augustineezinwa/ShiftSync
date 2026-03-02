DROP INDEX "swap_requests_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "swab_assignment_unique_requester_id" ON "swap_requests" ("userShiftId","requesterId");