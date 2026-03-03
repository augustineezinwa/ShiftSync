"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { SectionFilters } from "@/components/dashboard/SectionFilters";
import { StaffDashboardView } from "@/components/dashboard/StaffDashboardView";
import { useAuth } from "@/providers/AuthProvider";
import { LOCATIONS, SHIFTS, getOnDutyNow, type Role } from "@/lib/mock-data";

export default function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role as Role | undefined;
  const isStaff = role === "staff";
  const isManager = role === "manager";
  const isAdmin = role === "admin";

  if (isStaff) {
    return <StaffDashboardView />;
  }

  const locationIds: string[] | undefined = undefined;
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
        <Card>
          <CardHeader className="text-muted">Notifications</CardHeader>
          <p className="text-2xl font-semibold text-white">0</p>
        </Card>
      </div>
      <div className="mt-6">
        <Card>
          <CardHeader>Quick actions</CardHeader>
          <p className="text-sm text-muted">
            {isAdmin && "View locations, audit log, and overtime across all sites."}
            {isManager && "Manage shifts, approve swaps, and view overtime for your locations."}
          </p>
        </Card>
      </div>

      {isAdmin && (
        <div className="mt-6">
          <SectionFilters role={role} userId={user ? String(user.id) : null} />
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
