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

export type DayOfWeek = "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday";

export interface DayAvailability {
  start: string;
  end: string;
}

export type WeeklyAvailability = Partial<Record<DayOfWeek, DayAvailability | null>>;

export const DAYS_OF_WEEK: DayOfWeek[] = [
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
];

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: Role;
  locationIds: string[];
  skillIds: string[];
  desiredHoursPerWeek?: number;
  availability?: WeeklyAvailability;
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
  { id: "u4", name: "Sam Server", email: "sam@coastaleats.com", role: "staff", locationIds: ["loc1", "loc2"], skillIds: ["s3", "s4"], desiredHoursPerWeek: 32, availability: { monday: { start: "09:00", end: "17:00" }, tuesday: { start: "09:00", end: "17:00" }, wednesday: null, thursday: { start: "09:00", end: "17:00" }, friday: { start: "17:00", end: "23:00" }, saturday: { start: "10:00", end: "22:00" }, sunday: null } },
  { id: "u5", name: "Casey Cook", email: "casey@coastaleats.com", role: "staff", locationIds: ["loc1"], skillIds: ["s2"], desiredHoursPerWeek: 35, availability: { monday: { start: "11:00", end: "19:00" }, tuesday: { start: "11:00", end: "19:00" }, wednesday: { start: "11:00", end: "19:00" }, thursday: { start: "11:00", end: "19:00" }, friday: { start: "11:00", end: "23:00" }, saturday: null, sunday: null } },
  { id: "u6", name: "Blake Bartender", email: "blake@coastaleats.com", role: "staff", locationIds: ["loc1", "loc2"], skillIds: ["s1", "s3"], desiredHoursPerWeek: 30, availability: { monday: null, tuesday: { start: "17:00", end: "23:00" }, wednesday: { start: "17:00", end: "23:00" }, thursday: { start: "17:00", end: "23:00" }, friday: { start: "17:00", end: "23:00" }, saturday: { start: "17:00", end: "23:00" }, sunday: { start: "10:00", end: "18:00" } } },
  { id: "u7", name: "Riley Server", email: "riley@coastaleats.com", role: "staff", locationIds: ["loc3"], skillIds: ["s3"], desiredHoursPerWeek: 28, availability: {} },
  { id: "u8", name: "Jamie Host", email: "jamie@coastaleats.com", role: "staff", locationIds: ["loc3", "loc4"], skillIds: ["s4", "s3"], desiredHoursPerWeek: 25, availability: {} },
];

export const SHIFTS: Shift[] = [
  { id: "sh1", locationId: "loc1", date: "2025-03-01", startTime: "09:00", endTime: "17:00", skillId: "s3", headcount: 2, assignedStaffIds: ["u4", "u6"], status: "published", isPremium: false },
  { id: "sh2", locationId: "loc1", date: "2025-03-01", startTime: "17:00", endTime: "23:00", skillId: "s1", headcount: 1, assignedStaffIds: ["u6"], status: "published", isPremium: true },
  { id: "sh3", locationId: "loc1", date: "2025-03-02", startTime: "11:00", endTime: "19:00", skillId: "s2", headcount: 1, assignedStaffIds: ["u5"], status: "published", isPremium: false },
  { id: "sh7", locationId: "loc1", date: "2025-03-02", startTime: "17:00", endTime: "23:00", skillId: "s3", headcount: 1, assignedStaffIds: ["u4"], status: "published", isPremium: true }, // Sam gets 1 premium at loc1 → team median 1, Casey 0 = under-scheduled
  { id: "sh4", locationId: "loc2", date: "2025-03-01", startTime: "10:00", endTime: "18:00", skillId: "s4", headcount: 1, assignedStaffIds: [], status: "draft", isPremium: false },
  { id: "sh5", locationId: "loc3", date: "2025-03-01", startTime: "18:00", endTime: "23:00", skillId: "s3", headcount: 2, assignedStaffIds: ["u7"], status: "published", isPremium: true }, // Riley 1, Jamie 0 at loc3 → Jamie under-scheduled
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

// Overtime projections (projected weekly hours, status, notes/warnings)
export type OvertimeStatus = "ok" | "over" | "caution";

export interface OvertimeProjection {
  staffId: string;
  projectedHours: number;
  status: OvertimeStatus;
  notes: string;
}

export const OVERTIME_PROJECTIONS: OvertimeProjection[] = [
  { staffId: "u4", projectedHours: 38, status: "ok", notes: "Approaching 40h warning" },
  { staffId: "u5", projectedHours: 42, status: "over", notes: "Weekly OT exceeded" },
  { staffId: "u6", projectedHours: 36, status: "ok", notes: "6th day worked warning" },
  { staffId: "u7", projectedHours: 40, status: "caution", notes: "At weekly limit" },
  { staffId: "u8", projectedHours: 44, status: "over", notes: "Daily max exceeded (12h day)" },
];

// Live on-duty (staff currently clocked in) — admin dashboard
export interface OnDutyEntry {
  staffId: string;
  locationId: string;
  shiftStart: string;
  shiftEnd: string;
  status: "clocked_in";
}

export const ON_DUTY_NOW: OnDutyEntry[] = [
  { staffId: "u4", locationId: "loc1", shiftStart: "17:00", shiftEnd: "23:00", status: "clocked_in" },   // Sam Server @ Downtown
  { staffId: "u7", locationId: "loc3", shiftStart: "18:00", shiftEnd: "22:00", status: "clocked_in" },   // Riley Server @ Harbor
  { staffId: "u6", locationId: "loc2", shiftStart: "16:00", shiftEnd: "22:00", status: "clocked_in" },   // Blake Bartender @ Marina
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

export function getNextShiftForStaff(staffId: string): Shift | null {
  const shifts = getShiftsForStaff(staffId)
    .filter((s) => s.status === "published")
    .sort((a, b) => {
      const d = a.date.localeCompare(b.date);
      return d !== 0 ? d : a.startTime.localeCompare(b.startTime);
    });
  return shifts[0] ?? null;
}

/** Demo "now" so a shift is in progress for testing (2025-03-01 12:00 → shift 09:00–17:00 is current). */
const DEMO_NOW = new Date("2025-03-01T12:00:00");

/** Returns the shift that is currently in progress (today, and current time between start and end). */
export function getCurrentShiftForStaff(staffId: string, now: Date = DEMO_NOW): Shift | null {
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5);
  return (
    getShiftsForStaff(staffId)
      .filter(
        (s) =>
          s.status === "published" &&
          s.date === dateStr &&
          timeStr >= s.startTime &&
          timeStr <= s.endTime
      )[0] ?? null
  );
}

export function getShiftsForStaffAtLocation(
  staffId: string,
  locationId: string,
  dateFrom?: string,
  dateTo?: string
) {
  return SHIFTS.filter((s) => {
    if (s.locationId !== locationId || !s.assignedStaffIds.includes(staffId)) return false;
    if (dateFrom && s.date < dateFrom) return false;
    if (dateTo && s.date > dateTo) return false;
    return true;
  });
}

export function getPremiumShiftCountAtLocation(
  staffId: string,
  locationId: string,
  dateFrom?: string,
  dateTo?: string
) {
  return getShiftsForStaffAtLocation(staffId, locationId, dateFrom, dateTo).filter((s) => s.isPremium).length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
}

export function getTeamMedianPremiumAtLocation(
  locationId: string,
  dateFrom?: string,
  dateTo?: string
): number {
  const staffAtLocation = STAFF.filter(
    (s) => s.role === "staff" && s.locationIds.includes(locationId)
  );
  const premiumCounts = staffAtLocation.map((s) =>
    getPremiumShiftCountAtLocation(s.id, locationId, dateFrom, dateTo)
  );
  return median(premiumCounts);
}

export type FairnessStatus = "under" | "even" | "over";

export interface FairnessRow {
  staffId: string;
  staffName: string;
  locationId: string;
  locationName: string;
  assignedHours: number;
  desiredHours: number;
  premiumShifts: number;
  teamMedian: number;
  premiumDiff: number;
  status: FairnessStatus;
}

export function getFairnessRows(
  locationIds?: string[],
  dateFrom?: string,
  dateTo?: string
): FairnessRow[] {
  const locations = locationIds?.length
    ? LOCATIONS.filter((l) => locationIds.includes(l.id))
    : LOCATIONS;
  const staffList = STAFF.filter((s) => s.role === "staff");
  const rows: FairnessRow[] = [];
  for (const loc of locations) {
    const teamMedian = getTeamMedianPremiumAtLocation(loc.id, dateFrom, dateTo);
    const staffAtLoc = staffList.filter((s) => s.locationIds.includes(loc.id));
    for (const s of staffAtLoc) {
      const premiumCount = getPremiumShiftCountAtLocation(s.id, loc.id, dateFrom, dateTo);
      const shiftsAtLoc = getShiftsForStaffAtLocation(s.id, loc.id, dateFrom, dateTo);
      const assignedHours = shiftsAtLoc.length * 7;
      const premiumDiff = teamMedian - premiumCount;
      const status: FairnessStatus =
        premiumDiff > 0 ? "under" : premiumDiff < 0 ? "over" : "even";
      rows.push({
        staffId: s.id,
        staffName: s.name,
        locationId: loc.id,
        locationName: loc.name,
        assignedHours,
        desiredHours: s.desiredHoursPerWeek ?? 0,
        premiumShifts: premiumCount,
        teamMedian,
        premiumDiff,
        status,
      });
    }
  }
  return rows.sort((a, b) => a.locationName.localeCompare(b.locationName) || a.staffName.localeCompare(b.staffName));
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

export function getOvertimeProjections(locationIds?: string[]): (OvertimeProjection & { name: string })[] {
  const staffFilter = locationIds?.length
    ? (staffId: string) => {
        const s = getStaff(staffId);
        return s && s.role === "staff" && s.locationIds.some((lid) => locationIds.includes(lid));
      }
    : () => true;
  return OVERTIME_PROJECTIONS.filter((p) => staffFilter(p.staffId)).map((p) => ({
    ...p,
    name: getStaff(p.staffId)?.name ?? p.staffId,
  }));
}

export function getOnDutyNow(
  locationIds?: string[]
): (OnDutyEntry & { staffName: string; locationName: string })[] {
  const entries = locationIds?.length
    ? ON_DUTY_NOW.filter((e) => locationIds.includes(e.locationId))
    : ON_DUTY_NOW;
  return entries.map((entry) => ({
    ...entry,
    staffName: getStaff(entry.staffId)?.name ?? entry.staffId,
    locationName: getLocation(entry.locationId)?.name ?? entry.locationId,
  }));
}
