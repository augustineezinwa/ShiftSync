import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { SectionFilters } from "@/components/dashboard/SectionFilters";
import { SHIFTS, LOCATIONS, NOTIFICATIONS, getShiftsForStaff, getNextShiftForStaff, getCurrentShiftForStaff, getNotificationsForUser, getOnDutyNow, getLocation, getSkill, type Role } from "@/lib/mock-data";
import { CurrentShiftCard } from "@/components/dashboard/CurrentShiftCard";

interface PageProps {
  searchParams: Promise<{ role?: string; userId?: string; locations?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { role, userId, locations: locationsParam } = params;
  const locationIds = locationsParam ? locationsParam.split(",").filter(Boolean) : undefined;
  const isStaff = role === "staff";
  const isManager = role === "manager";
  const isAdmin = role === "admin";

  const myShifts = userId ? getShiftsForStaff(userId) : [];
  const nextShift = isStaff && userId ? getNextShiftForStaff(userId) : null;
  const currentShift = isStaff && userId ? getCurrentShiftForStaff(userId) : null;
  const notifications = userId ? getNotificationsForUser(userId) : [];
  const unreadCount = notifications.filter((n) => !n.read).length;
  const onDutyNow = isAdmin ? getOnDutyNow(locationIds) : [];

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isAdmin && (
          <>
            <Card>
              <CardHeader className="text-muted">Locations</CardHeader>
              <p className="text-2xl font-semibold text-white">
                {locationIds?.length ?? LOCATIONS.length}
              </p>
            </Card>
            <Card>
              <CardHeader className="text-muted">Total shifts (this week)</CardHeader>
              <p className="text-2xl font-semibold text-white">{SHIFTS.length}</p>
            </Card>
          </>
        )}
        {isManager && (
          <>
            <Card>
              <CardHeader className="text-muted">My locations</CardHeader>
              <p className="text-2xl font-semibold text-white">2</p>
            </Card>
            <Card>
              <CardHeader className="text-muted">Pending swap requests</CardHeader>
              <p className="text-2xl font-semibold text-warning">2</p>
            </Card>
          </>
        )}
        {isStaff && (
          <>
            <Card>
              <CardHeader className="text-muted">My shifts (upcoming)</CardHeader>
              <p className="text-2xl font-semibold text-white">{myShifts.length}</p>
            </Card>
            <Card>
              <CardHeader className="text-muted">Unread notifications</CardHeader>
              <p className="text-2xl font-semibold text-white">{unreadCount}</p>
            </Card>
          </>
        )}
        <Card>
          <CardHeader className="text-muted">Notifications</CardHeader>
          <p className="text-2xl font-semibold text-white">{notifications.length}</p>
        </Card>
      </div>
      <div className="mt-6">
        <Card>
          <CardHeader>Quick actions</CardHeader>
          <p className="text-sm text-muted">
            {isAdmin && "View locations, audit log, and overtime across all sites."}
            {isManager && "Manage shifts, approve swaps, and view overtime for your locations."}
            {isStaff && "View your shifts, request swaps or drops, and pick up available shifts."}
          </p>
        </Card>
      </div>

      {isStaff && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>Next shift</CardHeader>
            {nextShift ? (
              <div className="space-y-2">
                <p className="font-medium text-white">
                  {getLocation(nextShift.locationId)?.name ?? nextShift.locationId}
                </p>
                <p className="text-sm text-gray-300">
                  {nextShift.date} · {nextShift.startTime} – {nextShift.endTime}
                </p>
                <p className="text-sm text-muted">
                  {getSkill(nextShift.skillId)?.name ?? nextShift.skillId}
                  {nextShift.isPremium && (
                    <span className="ml-2 text-warning">Premium</span>
                  )}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted">No upcoming shifts scheduled.</p>
            )}
          </Card>
          <CurrentShiftCard shift={currentShift} />
        </div>
      )}

      {isAdmin && (
        <div className="mt-6">
          <SectionFilters role={role as Role} userId={userId} />
          {onDutyNow.length > 0 && (
          <Card>
            <CardHeader>Live on-duty</CardHeader>
            <p className="mb-3 text-sm text-muted">Staff currently clocked in across all locations.</p>
            <Table>
              <TableHead>
                <TableRow>
                  <Th>Staff Name</Th>
                  <Th>Location</Th>
                  <Th>Shift Start</Th>
                  <Th>Shift End</Th>
                  <Th>Status</Th>
                </TableRow>
              </TableHead>
              <TableBody>
                {onDutyNow.map((entry) => (
                  <TableRow key={`${entry.staffId}-${entry.locationId}-${entry.shiftStart}`}>
                    <Td className="font-medium text-gray-100">{entry.staffName}</Td>
                    <Td>{entry.locationName}</Td>
                    <Td>{entry.shiftStart}</Td>
                    <Td>{entry.shiftEnd}</Td>
                    <Td>
                      <span className="text-success">Clocked In ✅</span>
                    </Td>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          )}
        </div>
      )}
    </>
  );
}
