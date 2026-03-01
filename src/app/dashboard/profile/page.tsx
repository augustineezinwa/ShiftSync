"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AvailabilityEditor } from "@/components/dashboard/AvailabilityEditor";
import { useAuth } from "@/providers/AuthProvider";
import type { DayOfWeek, WeeklyAvailability } from "@/lib/mock-data";

const DAY_INDEX_TO_KEY: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function timeFromIso(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toTimeString().slice(0, 5);
  } catch {
    return "09:00";
  }
}

function availabilityFromApi(
  availabilities?: { dayOfWeek: number; startTime: string; endTime: string }[]
): WeeklyAvailability {
  const out: WeeklyAvailability = {};
  if (!availabilities?.length) return out;
  for (const a of availabilities) {
    const key = DAY_INDEX_TO_KEY[a.dayOfWeek];
    if (key) {
      out[key] = {
        start: timeFromIso(a.startTime),
        end: timeFromIso(a.endTime),
      };
    }
  }
  return out;
}

export default function ProfilePage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted">Loading profile…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <p className="text-muted">Sign in to view your profile.</p>
    );
  }

  const locations = user.locations ?? [];
  const skills = user.skills ?? [];
  const desiredHours = user.setting?.hoursPerWeek;
  const initialAvailability = availabilityFromApi(user.availabilities);

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
            <dd>
              <Badge>{user.role}</Badge>
            </dd>
          </div>
          {user.role === "staff" && (
            <>
              {locations.length > 0 && (
                <div>
                  <dt className="text-xs text-muted">Locations (certified)</dt>
                  <dd className="text-gray-200">
                    {locations.map((l) => l.name).join(", ")}
                  </dd>
                </div>
              )}
              {skills.length > 0 && (
                <div>
                  <dt className="text-xs text-muted">Skills</dt>
                  <dd>
                    {skills.map((s) => (
                      <Badge key={s.id} variant="muted" className="mr-1">
                        {s.name}
                      </Badge>
                    ))}
                  </dd>
                </div>
              )}
              {desiredHours != null && (
                <div>
                  <dt className="text-xs text-muted">Desired hours/week</dt>
                  <dd className="text-gray-200">{desiredHours}</dd>
                </div>
              )}
            </>
          )}
        </dl>
        <p className="mt-4 text-sm text-muted">
          Notification preferences: In-app (MVP).
        </p>
      </Card>

      {user.role === "staff" && (
        <div className="mt-6">
          <AvailabilityEditor initial={initialAvailability} />
        </div>
      )}
    </>
  );
}
