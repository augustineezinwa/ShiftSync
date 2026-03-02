
import ShiftController from "../controllers/ShiftController";
import { db } from "../db";
import { users, skills, locations, usersAvailability, usersLocations, usersSkills } from "../db/schema";

type User = typeof users.$inferSelect & {
    skills: typeof skills.$inferSelect[];
    locations: typeof locations.$inferSelect[];
    availabilities: typeof usersAvailability.$inferSelect[];
};

/**
 * function to get list of qualifie users for a shift
 * @param shiftId - the id of the shift
 * @param users - the list of users
 * @param skills - the list of skills
 * @returns the list of qualified users
 */
export async function getQualifiedUsersForShift(shiftId: number) {
    const shift = await ShiftController.getShift(shiftId);
    if (!shift) {
        return [];
    }

    const shiftSkill = shift.skill;
    const shiftLocation = shift.location;
    const shiftStartTime = shift.startTime;
    const shiftEndTime = shift.endTime;

    const userLocations = await db.query.usersLocations.findMany({
        where: {
            locationId: Number(shiftLocation?.id)
        }
    })
    const users = await db.query.users.findMany({
        with: {
            skills: true,
            locations: true,
            availabilities: true,
        },
        where: {
            id: { in: userLocations.map((userLocation) => Number(userLocation.userId)) }
        }
    });

    const qualifiedUsers = users.filter((user) => {
        return user?.skills.some((skill) => skill.id === shiftSkill?.id) && user.locations.some((location) => location.id === shiftLocation?.id) && user.availabilities.some((availability) => new Date(availability.startTime) <= shiftStartTime && new Date(availability.endTime) >= shiftEndTime);
    });

    return qualifiedUsers;
}


/** Returns a string of user names as bullet points. If label is set, returns "" when users is empty (so the label and list are not shown). */
export function getFormattedUsersWithBulletPoints(users: User[], label?: string): string {
    if (!users.length) return "";
    const bullets = users.map((u) => "• " + (u.name ?? "Unknown")).join("\n");
    return label ? `${label}\n${bullets}` : bullets;
}