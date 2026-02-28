import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AvailabilityEditor } from "@/components/dashboard/AvailabilityEditor";
import { getStaff, SKILLS, LOCATIONS } from "@/lib/mock-data";

interface PageProps {
  searchParams: Promise<{ userId?: string }>;
}

export default async function ProfilePage({ searchParams }: PageProps) {
  const { userId } = await searchParams;
  const user = userId ? getStaff(userId) : null;

  if (!user) {
    return (
      <p className="text-muted">Select a role from the home page to view profile.</p>
    );
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Profile</h1>
      <Card>
        <CardHeader>Account</CardHeader>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted">Name</dt>
            <dd className="font-medium text-white">{user.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Email</dt>
            <dd className="text-gray-200">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted">Role</dt>
            <dd><Badge>{user.role}</Badge></dd>
          </div>
          {user.role === "staff" && (
            <>
              <div>
                <dt className="text-xs text-muted">Locations (certified)</dt>
                <dd className="text-gray-200">
                  {user.locationIds.map((lid) => LOCATIONS.find((l) => l.id === lid)?.name ?? lid).join(", ")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted">Skills</dt>
                <dd>
                  {user.skillIds.map((sid) => (
                    <Badge key={sid} variant="muted" className="mr-1">
                      {SKILLS.find((k) => k.id === sid)?.name ?? sid}
                    </Badge>
                  ))}
                </dd>
              </div>
              {user.desiredHoursPerWeek != null && (
                <div>
                  <dt className="text-xs text-muted">Desired hours/week</dt>
                  <dd className="text-gray-200">{user.desiredHoursPerWeek}</dd>
                </div>
              )}
            </>
          )}
        </dl>
        <p className="mt-4 text-sm text-muted">Notification preferences: In-app (MVP).</p>
      </Card>

      {user.role === "staff" && (
        <div className="mt-6">
          <AvailabilityEditor initial={user.availability ?? {}} />
        </div>
      )}
    </>
  );
}
