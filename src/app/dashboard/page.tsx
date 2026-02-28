import { Card, CardHeader } from "@/components/ui/Card";
import { SHIFTS, LOCATIONS, NOTIFICATIONS, getShiftsForStaff, getNotificationsForUser } from "@/lib/mock-data";

interface PageProps {
  searchParams: Promise<{ role?: string; userId?: string }>;
}

export default async function DashboardPage({ searchParams }: PageProps) {
  const { role, userId } = await searchParams;
  const isStaff = role === "staff";
  const isManager = role === "manager";
  const isAdmin = role === "admin";

  const myShifts = userId ? getShiftsForStaff(userId) : [];
  const notifications = userId ? getNotificationsForUser(userId) : [];
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isAdmin && (
          <>
            <Card>
              <CardHeader className="text-muted">Locations</CardHeader>
              <p className="text-2xl font-semibold text-white">{LOCATIONS.length}</p>
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
    </>
  );
}
