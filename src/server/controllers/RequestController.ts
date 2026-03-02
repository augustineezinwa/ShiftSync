import { db } from "@/server/db";
import { shifts, swapRequests, usersShifts } from "../db/schema";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

export type RequestStatus = "pending" | "pending_manager_approval" | "accepted" | "rejected" | "cancelled";

class RequestController {
    static async createRequest(requesterId: number, type: "swap" | "drop", userShiftId: number, targetUserId?: number) {
        const shift = await db.query.shifts.findFirst({
            where: {
                id: userShiftId
            },
            with: {
                usersShifts: true,
            }
        });
        if (targetUserId && type === 'swap') {

            const shiftAssignment = shift?.usersShifts.find((s) => s.userId === targetUserId);
            if (!shiftAssignment) {
                throw new HTTPException(400, { message: "Target user is not assigned to this shift" });
            }
            const [request] = await db.insert(swapRequests).values({ requesterId, type, userShiftId: shiftAssignment.id, targetUserId }).returning();
            return request;

        } else {
            const shiftAssignment = shift?.usersShifts.find((s) => s.userId === requesterId);
            if (!shiftAssignment) {
                throw new HTTPException(400, { message: "Requester is not assigned to this shift" });
            }
            const [request] = await db.insert(swapRequests).values({ requesterId, type, userShiftId: shiftAssignment.id, targetUserId }).returning();
            return request;
        }
    }

    static async getRequests(requesterId: number) {
        const requests = await db.select({ id: swapRequests.id }).from(swapRequests).where((or(eq(swapRequests.requesterId, requesterId), eq(swapRequests.targetUserId, requesterId))));
        const requestIds = requests.map((r) => r.id);

        const requestsWithShift = await db.query.swapRequests.findMany({
            with: {
                userShift: {
                    with: {
                        shift: {
                            with: {
                                location: true
                            }
                        }
                    }
                },
                targetUser: true,
                requester: true
            },
            where: { id: { in: requestIds } },
            orderBy: {
                createdAt: "desc"
            }
        });

        return requestsWithShift;
    }

    static async getRequestsForManager(locationIds: number[]) {
        const requests = await db
            .select({ id: swapRequests.id })
            .from(swapRequests)
            .innerJoin(usersShifts, eq(swapRequests.userShiftId, usersShifts.id))
            .innerJoin(shifts, eq(usersShifts.shiftId, shifts.id))
            .where(
                and(
                    inArray(swapRequests.status, [
                        "pending_manager_approval",
                        "accepted",
                        "rejected",
                    ]),
                    inArray(shifts.locationId, locationIds)
                )
            );

        const requestIds = requests.map((r) => r.id);

        const requestsWithShift = await db.query.swapRequests.findMany({
            with: {
                userShift: {
                    with: {
                        shift: {
                            with: {
                                location: true
                            }
                        }
                    }
                },
                targetUser: true,
                requester: true
            },
            where: { id: { in: requestIds } },
            orderBy: {
                createdAt: "desc"
            }
        });

        return requestsWithShift;
    }

    static async getRequest(requestId: number) {
        return await db.query.swapRequests.findFirst({
            where: { id: requestId },
        });
    }

    static async updateRequestStatus(requestId: number, status: RequestStatus) {
        const oldRequest = await this.getRequest(requestId);
        const [request] = await db.update(swapRequests).set({ status }).where(eq(swapRequests.id, requestId)).returning();


        if (oldRequest?.status === "pending_manager_approval" && request.type === 'swap' && request.status === 'accepted') {
            await db.update(usersShifts).set({ userId: Number(request.requesterId) }).where(eq(usersShifts.id, request.userShiftId));
        } else if (oldRequest?.status === "pending_manager_approval" && request.type === 'drop' && request.status === 'accepted') {
            await db.delete(usersShifts).where(eq(usersShifts.id, request.userShiftId));
        }

        return request;
    }
}

export default RequestController;