// ShiftSync mock data — Coastal Eats (4 locations, 2 timezones)

export type Role = "admin" | "manager" | "staff";
export type ShiftStatus = "draft" | "published";
export type SwapStatus = "pending" | "accepted" | "rejected" | "approved" | "cancelled";

export interface Location {
  id: string;
  name: string;
  timezone: string;
  managerIds: string[];
}

export interface Skill {
  id: string;
  name: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: Role;
  locationIds: string[];
  skillIds: string[];
  desiredHoursPerWeek?: number;
}

export interface Shift {
  id: string;
  locationId: string;
  date: string;
  startTime: string;
  endTime: string;
  skillId: string;
  headcount: number;
  assignedStaffIds: string[];
  status: ShiftStatus;
  isPremium?: boolean; // Fri/Sat evening
}

export interface SwapRequest {
  id: string;
  shiftId: string;
  type: "swap" | "drop";
  requesterId: string;
  targetStaffId?: string; // for swap
  status: SwapStatus;
  createdAt: string;
  expiresAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: "shift_assigned" | "swap_request" | "schedule_published" | "overtime_warning" | "availability_change";
}

export interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  entityType: "shift" | "schedule" | "staff";
  entityId: string;
  before?: string;
  after?: string;
  timestamp: string;
}

// Mock data
export const SKILLS: Skill[] = [
  { id: "s1", name: "Bartender" },
  { id: "s2", name: "Line Cook" },
  { id: "s3", name: "Server" },
  { id: "s4", name: "Host" },
];

export const LOCATIONS: Location[] = [
  { id: "loc1", name: "Coastal Eats Downtown", timezone: "America/Los_Angeles", managerIds: ["u2"] },
  { id: "loc2", name: "Coastal Eats Marina", timezone: "America/Los_Angeles", managerIds: ["u2"] },
  { id: "loc3", name: "Coastal Eats Harbor", timezone: "America/New_York", managerIds: ["u3"] },
  { id: "loc4", name: "Coastal Eats Bay", timezone: "America/New_York", managerIds: ["u3"] },
];

export const STAFF: Staff[] = [
  { id: "u1", name: "Alex Admin", email: "alex@coastaleats.com", role: "admin", locationIds: ["loc1", "loc2", "loc3", "loc4"], skillIds: [] },
  { id: "u2", name: "Morgan Manager", email: "morgan@coastaleats.com", role: "manager", locationIds: ["loc1", "loc2"], skillIds: [], desiredHoursPerWeek: 40 },
  { id: "u3", name: "Jordan Manager", email: "jordan@coastaleats.com", role: "manager", locationIds: ["loc3", "loc4"], skillIds: [], desiredHoursPerWeek: 40 },
  { id: "u4", name: "Sam Server", email: "sam@coastaleats.com", role: "staff", locationIds: ["loc1", "loc2"], skillIds: ["s3", "s4"], desiredHoursPerWeek: 32 },
  { id: "u5", name: "Casey Cook", email: "casey@coastaleats.com", role: "staff", locationIds: ["loc1"], skillIds: ["s2"], desiredHoursPerWeek: 35 },
  { id: "u6", name: "Blake Bartender", email: "blake@coastaleats.com", role: "staff", locationIds: ["loc1", "loc2"], skillIds: ["s1", "s3"], desiredHoursPerWeek: 30 },
  { id: "u7", name: "Riley Server", email: "riley@coastaleats.com", role: "staff", locationIds: ["loc3"], skillIds: ["s3"], desiredHoursPerWeek: 28 },
  { id: "u8", name: "Jamie Host", email: "jamie@coastaleats.com", role: "staff", locationIds: ["loc3", "loc4"], skillIds: ["s4", "s3"], desiredHoursPerWeek: 25 },
];

export const SHIFTS: Shift[] = [
  { id: "sh1", locationId: "loc1", date: "2025-03-01", startTime: "09:00", endTime: "17:00", skillId: "s3", headcount: 2, assignedStaffIds: ["u4", "u6"], status: "published", isPremium: false },
  { id: "sh2", locationId: "loc1", date: "2025-03-01", startTime: "17:00", endTime: "23:00", skillId: "s1", headcount: 1, assignedStaffIds: ["u6"], status: "published", isPremium: true },
  { id: "sh3", locationId: "loc1", date: "2025-03-02", startTime: "11:00", endTime: "19:00", skillId: "s2", headcount: 1, assignedStaffIds: ["u5"], status: "published", isPremium: false },
  { id: "sh4", locationId: "loc2", date: "2025-03-01", startTime: "10:00", endTime: "18:00", skillId: "s4", headcount: 1, assignedStaffIds: [], status: "draft", isPremium: false },
  { id: "sh5", locationId: "loc3", date: "2025-03-01", startTime: "18:00", endTime: "23:00", skillId: "s3", headcount: 2, assignedStaffIds: ["u7", "u8"], status: "published", isPremium: true },
  { id: "sh6", locationId: "loc1", date: "2025-03-03", startTime: "09:00", endTime: "15:00", skillId: "s3", headcount: 1, assignedStaffIds: [], status: "draft", isPremium: false },
];

export const SWAP_REQUESTS: SwapRequest[] = [
  { id: "sw1", shiftId: "sh1", type: "swap", requesterId: "u4", targetStaffId: "u6", status: "pending", createdAt: "2025-02-27T10:00:00Z" },
  { id: "sw2", shiftId: "sh5", type: "drop", requesterId: "u7", status: "pending", createdAt: "2025-02-27T12:00:00Z", expiresAt: "2025-02-28T18:00:00Z" },
];

export const NOTIFICATIONS: Notification[] = [
  { id: "n1", userId: "u4", title: "Shift assigned", message: "You're assigned to Coastal Eats Downtown, Mar 1, 9:00–17:00", read: false, createdAt: "2025-02-26T09:00:00Z", type: "shift_assigned" },
  { id: "n2", userId: "u2", title: "Swap request", message: "Sam Server requested to swap shift with Blake Bartender", read: false, createdAt: "2025-02-27T10:05:00Z", type: "swap_request" },
  { id: "n3", userId: "u2", title: "Overtime warning", message: "Casey Cook is projected at 42 hours this week", read: true, createdAt: "2025-02-25T14:00:00Z", type: "overtime_warning" },
  { id: "n4", userId: "u1", title: "Schedule published", message: "Week of Mar 1 published for Coastal Eats Downtown", read: true, createdAt: "2025-02-24T08:00:00Z", type: "schedule_published" },
];

export const AUDIT_LOGS: AuditEntry[] = [
  { id: "a1", userId: "u2", action: "published_schedule", entityType: "schedule", entityId: "loc1", after: "week_2025-03-01", timestamp: "2025-02-24T08:00:00Z" },
  { id: "a2", userId: "u2", action: "assigned_staff", entityType: "shift", entityId: "sh1", before: "[]", after: '["u4","u6"]', timestamp: "2025-02-23T11:00:00Z" },
];

// Helpers
export function getLocation(id: string) {
  return LOCATIONS.find((l) => l.id === id);
}
export function getSkill(id: string) {
  return SKILLS.find((s) => s.id === id);
}
export function getStaff(id: string) {
  return STAFF.find((s) => s.id === id);
}
export function getShift(id: string) {
  return SHIFTS.find((s) => s.id === id);
}

export function getShiftsForLocation(locationId: string) {
  return SHIFTS.filter((s) => s.locationId === locationId);
}
export function getShiftsForStaff(staffId: string) {
  return SHIFTS.filter((s) => s.assignedStaffIds.includes(staffId));
}
export function getAvailableShifts(staffId: string) {
  const staff = getStaff(staffId);
  if (!staff) return [];
  return SHIFTS.filter(
    (s) =>
      s.status === "published" &&
      s.assignedStaffIds.length < s.headcount &&
      staff.locationIds.includes(s.locationId) &&
      staff.skillIds.includes(s.skillId) &&
      !s.assignedStaffIds.includes(staffId)
  );
}
export function getNotificationsForUser(userId: string) {
  return NOTIFICATIONS.filter((n) => n.userId === userId);
}
export function getPendingSwapRequestsForManager(managerId: string) {
  const manager = getStaff(managerId);
  if (!manager) return [];
  const locIds = manager.locationIds;
  return SWAP_REQUESTS.filter(
    (r) => r.status === "pending" && getShift(r.shiftId) && locIds.includes(getShift(r.shiftId)!.locationId)
  );
}
