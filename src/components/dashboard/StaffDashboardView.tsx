"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  getMyShifts,
  getMyNotifications,
  getDuties,
  createDuty,
  MY_NOTIFICATIONS_QUERY_KEY,
  type ApiShift,
} from "@/lib/api";
import { formatShiftDateInTz, formatShiftTimeInTz, isPremiumShift } from "@/lib/shift-utils";

const POLL_INTERVAL_MS = 5_000;

function parseShiftTime(iso: string | Date): Date {
  if (iso instanceof Date) return iso;
  const s = String(iso).trim();
  const asUtc = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?$/i.test(s) ? `${s}Z` : s;
  return new Date(asUtc);
}

function getCurrentAndNext(shifts: ApiShift[]) {
  const now = Date.now();
  const sorted = [...shifts].sort(
    (a, b) => parseShiftTime(a.startTime).getTime() - parseShiftTime(b.startTime).getTime()
  );
  let current: ApiShift | null = null;
  let next: ApiShift | null = null;
  for (const s of sorted) {
    const start = parseShiftTime(s.startTime).getTime();
    const end = parseShiftTime(s.endTime).getTime();
    if (start <= now && now <= end) current = s;
    if (start > now && next === null) next = s;
  }
  return { current, next };
}

function getUpcomingCount(shifts: ApiShift[]): number {
  const now = Date.now();
  return shifts.filter((s) => parseShiftTime(s.startTime).getTime() > now).length;
}

export function StaffDashboardView() {
  const queryClient = useQueryClient();

  const { data: shifts = [], isLoading: shiftsLoading } = useQuery({
    queryKey: ["me", "shifts", "dashboard"],
    queryFn: () => getMyShifts(),
    refetchInterval: POLL_INTERVAL_MS,
  });

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: MY_NOTIFICATIONS_QUERY_KEY,
    queryFn: getMyNotifications,
    refetchInterval: POLL_INTERVAL_MS,
  });

  const { data: duties = [], isLoading: dutiesLoading } = useQuery({
    queryKey: ["duties"],
    queryFn: getDuties,
    refetchInterval: POLL_INTERVAL_MS,
  });

  const clockIn = useMutation({
    mutationFn: createDuty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["duties"] });
    },
  });

  const myShifts = Array.isArray(shifts) ? shifts : [];
  const upcomingCount = getUpcomingCount(myShifts);
  const { current: currentShift, next: nextShift } = getCurrentAndNext(myShifts);
  const unreadCount = Array.isArray(notifications) ? notifications.length : 0;
  const clockedInShiftIds = new Set((Array.isArray(duties) ? duties : []).map((d: { shiftId?: number }) => d.shiftId).filter(Boolean));
  const isClockedIn = currentShift != null && clockedInShiftIds.has(currentShift.id);

  const tz = (s: ApiShift) => (s.location as { timezone?: string } | null)?.timezone ?? "UTC";

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="text-muted">My shifts</CardHeader>
          <p className="text-2xl font-semibold text-white">
            {shiftsLoading ? "—" : myShifts.length}
          </p>
        </Card>
        <Card>
          <CardHeader className="text-muted">Upcoming</CardHeader>
          <p className="text-2xl font-semibold text-white">
            {shiftsLoading ? "—" : upcomingCount}
          </p>
        </Card>
        <Card>
          <CardHeader className="text-muted">Unread notifications</CardHeader>
          <p className="text-2xl font-semibold text-white">
            {notificationsLoading ? "—" : unreadCount}
          </p>
        </Card>
        <Card>
          <CardHeader className="text-muted">Notifications</CardHeader>
          <p className="text-2xl font-semibold text-white">
            {notificationsLoading ? "—" : unreadCount}
          </p>
        </Card>
      </div>

      <div className="mt-6">
        <Card>
          <CardHeader>Quick actions</CardHeader>
          <p className="text-sm text-muted">
            View your shifts, request swaps or drops, and pick up available shifts.
          </p>
        </Card>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>Next shift</CardHeader>
          {nextShift ? (
            <div className="space-y-2">
              <p className="font-medium text-white">
                {(nextShift.location as { name?: string } | null)?.name ?? "—"}
              </p>
              <p className="text-sm text-gray-300">
                {formatShiftDateInTz(nextShift.startTime, tz(nextShift))} ·{" "}
                {formatShiftTimeInTz(nextShift.startTime, tz(nextShift))} –{" "}
                {formatShiftTimeInTz(nextShift.endTime, tz(nextShift))}
              </p>
              <p className="text-sm text-muted">
                {(nextShift.skill as { name?: string } | null)?.name ?? "—"}
                {isPremiumShift(nextShift.startTime, nextShift.endTime, tz(nextShift)) && (
                  <span className="ml-2 text-warning">Premium</span>
                )}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted">No upcoming shifts scheduled.</p>
          )}
        </Card>

        <Card>
          <CardHeader>Current shift</CardHeader>
          {currentShift ? (
            <>
              <div className="space-y-2">
                <p className="font-medium text-white">
                  {(currentShift.location as { name?: string } | null)?.name ?? "—"}
                </p>
                <p className="text-sm text-gray-300">
                  {formatShiftDateInTz(currentShift.startTime, tz(currentShift))} ·{" "}
                  {formatShiftTimeInTz(currentShift.startTime, tz(currentShift))} –{" "}
                  {formatShiftTimeInTz(currentShift.endTime, tz(currentShift))}
                </p>
                <p className="text-sm text-muted">
                  {(currentShift.skill as { name?: string } | null)?.name ?? "—"}
                  {isPremiumShift(currentShift.startTime, currentShift.endTime, tz(currentShift)) && (
                    <span className="ml-2 text-warning">Premium</span>
                  )}
                </p>
              </div>
              {isClockedIn ? (
                <p className="mt-4 text-success">Clocked in ✅</p>
              ) : (
                <Button
                  onClick={() => clockIn.mutate(currentShift.id)}
                  disabled={clockIn.isPending || dutiesLoading}
                  className="mt-4"
                >
                  {clockIn.isPending ? "Clocking in…" : "Clock in"}
                </Button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted">No shift in progress.</p>
          )}
        </Card>
      </div>
    </>
  );
}
