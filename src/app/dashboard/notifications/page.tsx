"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  getMyNotifications,
  markNotificationRead,
  MY_NOTIFICATIONS_QUERY_KEY,
  type MyNotification,
} from "@/lib/api";

const NOTIFICATION_TYPE_TITLES: Record<string, string> = {
  shift_assigned: "Shift assigned",
  swap_request: "Swap request",
  schedule_published: "Schedule published",
  overtime_warning: "Overtime warning",
  availability_change: "Availability change",
};

function getNotificationTitle(n: MyNotification): string {
  if (n.title != null && String(n.title).trim()) return String(n.title).trim();
  return NOTIFICATION_TYPE_TITLES[n.type] || "Notification";
}

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading, error } = useQuery({
    queryKey: MY_NOTIFICATIONS_QUERY_KEY,
    queryFn: getMyNotifications,
    refetchInterval: 20_000,
  });

  const markRead = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MY_NOTIFICATIONS_QUERY_KEY });
    },
  });

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Notifications</h1>
      <Card padding="none">
        <CardHeader className="border-b border-border p-4">Notification center</CardHeader>
        {error && (
          <p className="p-4 text-center text-danger">
            {error instanceof Error ? error.message : "Failed to load notifications."}
          </p>
        )}
        {!error && (
          <ul className="divide-y divide-border">
            {isLoading ? (
              <li className="px-4 py-6 text-center text-muted">Loading…</li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className="flex items-start justify-between gap-4 px-4 py-3 bg-accent/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-200">{getNotificationTitle(n)}</p>
                    <p className="mt-0.5 text-sm text-muted whitespace-pre-line">
                      {n.message ?? "—"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => markRead.mutate(n.id)}
                    disabled={markRead.isPending}
                    className="shrink-0"
                  >
                    Mark as read
                  </Button>
                </li>
              ))
            )}
          </ul>
        )}
        {!error && !isLoading && notifications.length === 0 && (
          <p className="p-6 text-center text-muted">No notifications.</p>
        )}
      </Card>
    </>
  );
}
