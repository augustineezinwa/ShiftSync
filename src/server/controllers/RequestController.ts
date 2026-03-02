import { db } from "@/server/db";
import { shifts, swapRequests, usersShifts } from "../db/schema";
import { and, desc, eq, inArray, or } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import ShiftController from "./ShiftController";

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
            const [request] = await db.insert(swapRequests).values({ requesterId, type, userShiftId: shiftAssignment.id, shiftId: userShiftId, targetUserId }).returning();
            return request;

        } else {
            const shiftAssignment = shift?.usersShifts.find((s) => s.userId === requesterId);
            if (!shiftAssignment) {
                throw new HTTPException(400, { message: "Requester is not assigned to this shift" });
            }
            const [request] = await db.insert(swapRequests).values({ requesterId, type, userShiftId: shiftAssignment.id, shiftId: userShiftId, targetUserId }).returning();
            return request;
        }
    }

    static async getRequests(requesterId: number) {
        const requests = await db.select({ id: swapRequests.id }).from(swapRequests).where((or(eq(swapRequests.requesterId, requesterId), eq(swapRequests.targetUserId, requesterId))));
        const requestIds = requests.map((r) => r.id);

        const requestsWithShift = await db.query.swapRequests.findMany({
            with: {
                shift: true,
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

        const requestsWithShift = await db.query.swapRequests.findMany({
            with: {
                shift: {
                    with: {
                        location: true
                    }
                },
                targetUser: true,
                requester: true
            },
            where: { status: { in: ["pending_manager_approval", "accepted", "rejected"] }, shift: { locationId: { in: locationIds } } },
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

    static async updateRequestStatus(requestId: number, status: RequestStatus, userId: number) {
        const oldRequest = await this.getRequest(requestId);
        const [request] = await db.update(swapRequests).set({ status }).where(eq(swapRequests.id, requestId)).returning();

        if (oldRequest?.status === "pending" && request.status === 'pending_manager_approval' && request.type === 'drop') {
            await db.update(swapRequests).set({ targetUserId: userId }).where(eq(swapRequests.id, requestId));
        }


        if (oldRequest?.status === "pending_manager_approval" && request.type === 'swap' && request.status === 'accepted') {
            await db.update(usersShifts).set({ userId: Number(request.requesterId) }).where(eq(usersShifts.id, Number(request.userShiftId)));
        } else if (oldRequest?.status === "pending_manager_approval" && request.type === 'drop' && request.status === 'accepted') {
            await db.update(swapRequests).set({ userShiftId: null }).where(eq(swapRequests.shiftId, request.shiftId));
            await db.update(usersShifts).set({ userId: Number(request.targetUserId) }).where(eq(usersShifts.id, Number(request.userShiftId)));
        }

        return request;
    }

    static async getPendingRequests(requesterId: number) {
        return await db.query.swapRequests.findMany({
            where: {
                requesterId: requesterId,
                status: {
                    in: ["pending", "pending_manager_approval"]
                }
            }
        });
    }

    static async getPickUpRequestsForUser(userId: number, locationIds: number[]) {
        const qualifiedShifts = await ShiftController.getQualifiedShiftsForUser(userId, locationIds);
        const shiftIds = qualifiedShifts.map((s) => s.id);
        return await db.query.swapRequests.findMany({
            with: {
                shift: {
                    with: {
                        location: true
                    }
                },
                targetUser: true,
                requester: true
            },
            where: {
                status: {
                    in: ["pending", "pending_manager_approval", "accepted", "rejected", "cancelled"]
                },
                shiftId: {
                    in: shiftIds
                }
            }
        });
    }
}

export default RequestController;