import ShiftController from "../controllers/ShiftController";
import { db } from "../db";
import { users, skills, locations, usersAvailability, usersLocations } from "../db/schema";

type User = typeof users.$inferSelect & {
    skills: typeof skills.$inferSelect[];
    locations: typeof locations.$inferSelect[];
    availabilities: typeof usersAvailability.$inferSelect[];
};

const MIN_HOURS_BETWEEN_SHIFTS = 10;
const MS_PER_HOUR = 60 * 60 * 1000;

/** Same as checkDoubleBooking: no overlapping shifts for this user. */
function userHasOverlappingShift(userId: number, shiftId: number, shiftStart: Date, shiftEnd: Date): Promise<boolean> {
    return ShiftController.getShiftsAssignedToUser(userId, shiftId).then((shifts) => {
        const start = shiftStart.getTime();
        const end = shiftEnd.getTime();
        return shifts.some((s) => {
            const sStart = s.startTime.getTime();
            const sEnd = s.endTime.getTime();
            return start < sEnd && sStart < end;
        });
    });
}

/** Same as assertMinHoursBetweenShifts: no shift in the 10h window before shift start. */
function userHasShiftInMinHoursWindow(userId: number, shiftId: number, shiftStart: Date): Promise<boolean> {
    const windowEndMs = shiftStart.getTime();
    const windowStartMs = windowEndMs - MIN_HOURS_BETWEEN_SHIFTS * MS_PER_HOUR;
    return ShiftController.getShiftsAssignedToUser(userId, shiftId).then((shifts) =>
        shifts.some((s) => {
            const t = s.startTime.getTime();
            const u = s.endTime.getTime();
            return (t >= windowStartMs && t <= windowEndMs) || (u >= windowStartMs && u <= windowEndMs);
        })
    );
}

/**
 * Returns the list of users qualified for a shift: same location, required skill, availability,
 * and no double-booking or violation of minimum 10 hours between shifts.
 */
export async function getQualifiedUsersForShift(shiftId: number) {
    const shift = await ShiftController.getShift(shiftId);
    if (!shift) {
        return [];
    }

    const shiftSkill = shift.skill;
    const shiftLocation = shift.location;
    const shiftStartTime = shift.startTime instanceof Date ? shift.startTime : new Date(shift.startTime);
    const shiftEndTime = shift.endTime instanceof Date ? shift.endTime : new Date(shift.endTime);

    const userLocations = await db.query.usersLocations.findMany({
        where: {
            locationId: Number(shiftLocation?.id),
        },
    });
    const usersAtLocation = await db.query.users.findMany({
        with: {
            skills: true,
            locations: true,
            availabilities: true,
        },
        where: {
            id: { in: userLocations.map((ul) => Number(ul.userId)) },
        },
    });

    const bySkillLocationAvailability = usersAtLocation.filter((user) => {
        return (
            user?.skills.some((s) => s.id === shiftSkill?.id) &&
            user.locations.some((loc) => loc.id === shiftLocation?.id) &&
            user.availabilities.some(
                (a) =>
                    new Date(a.startTime as unknown as string) <= shiftStartTime &&
                    new Date(a.endTime as unknown as string) >= shiftEndTime
            )
        );
    });

    const qualifiedUsers: User[] = [];
    for (const user of bySkillLocationAvailability) {
        const [overlap, inWindow] = await Promise.all([
            userHasOverlappingShift(user.id, shiftId, shiftStartTime, shiftEndTime),
            userHasShiftInMinHoursWindow(user.id, shiftId, shiftStartTime),
        ]);
        if (!overlap && !inWindow) {
            qualifiedUsers.push(user);
        }
    }

    return qualifiedUsers;
}


/** Returns a string of user names as bullet points. If label is set, returns "" when users is empty (so the label and list are not shown). */
export function getFormattedUsersWithBulletPoints(users: User[], label?: string): string {
    if (!users.length) return "";
    const bullets = users.map((u) => "• " + (u.name ?? "Unknown")).join("\n");
    return label ? `${label}\n${bullets}` : bullets;
}