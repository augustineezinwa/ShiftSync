import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getNotificationsForUser } from "@/lib/mock-data";

interface PageProps {
  searchParams: Promise<{ userId?: string }>;
}

export default async function NotificationsPage({ searchParams }: PageProps) {
  const { userId } = await searchParams;
  const notifications = userId ? getNotificationsForUser(userId) : [];

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Notifications</h1>
      <Card padding="none">
        <CardHeader className="border-b border-border p-4">Notification center</CardHeader>
        <ul className="divide-y divide-border">
          {notifications.map((n) => (
            <li
              key={n.id}
              className={`flex items-start justify-between gap-4 px-4 py-3 ${!n.read ? "bg-accent/5" : ""}`}
            >
              <div>
                <p className="font-medium text-gray-200">{n.title}</p>
                <p className="text-sm text-muted">{n.message}</p>
                <p className="mt-1 text-xs text-muted">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
              {!n.read && <Badge variant="default">New</Badge>}
            </li>
          ))}
        </ul>
        {notifications.length === 0 && (
          <p className="p-6 text-center text-muted">No notifications.</p>
        )}
      </Card>
    </>
  );
}
