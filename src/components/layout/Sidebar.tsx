"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Calendar,
  Users,
  MapPin,
  Bell,
  FileText,
  ArrowLeftRight,
  Clock,
  UserCircle,
  LogOut,
  Settings,
} from "lucide-react";
import { logout, getMyNotifications, MY_NOTIFICATIONS_QUERY_KEY } from "@/lib/api";
import type { Role } from "@/lib/mock-data";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "staff"] },
  { href: "/dashboard/shifts", label: "Shifts", icon: Calendar, roles: ["admin", "manager", "staff"] },
  { href: "/dashboard/swap-requests", label: "Swap / Drop", icon: ArrowLeftRight, roles: ["manager", "staff"] },
  { href: "/dashboard/available", label: "Pick up shifts", icon: Clock, roles: ["staff"] },
  { href: "/dashboard/staff", label: "Staff", icon: Users, roles: ["admin", "manager"] },
  { href: "/dashboard/locations", label: "Locations", icon: MapPin, roles: ["admin", "manager"] },
  { href: "/dashboard/overtime", label: "Overtime", icon: Clock, roles: ["admin", "manager"] },
  { href: "/dashboard/fairness", label: "Fairness", icon: FileText, roles: ["admin", "manager"] },
  { href: "/dashboard/audit", label: "Audit log", icon: FileText, roles: ["admin"] },
  { href: "/dashboard/settings", label: "Settings", icon: Settings, roles: ["admin"] },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell, roles: ["admin", "manager", "staff"] },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle, roles: ["admin", "manager", "staff"] },
];

interface SidebarProps {
  role: Role;
  open?: boolean;
  onClose?: () => void;
  onToggle?: () => void;
}

export function Sidebar({ role, open = false, onClose, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const items = navItems.filter((item) => item.roles.includes(role));
  const { data: notifications = [] } = useQuery({
    queryKey: MY_NOTIFICATIONS_QUERY_KEY,
    queryFn: getMyNotifications,
    refetchInterval: 20_000,
  });
  const unreadCount = notifications.length;

  return (
    <aside
      className={clsx(
        "fixed left-0 top-0 z-30 flex h-screen w-52 shrink-0 flex-col border-r border-border bg-surfaceElevated transition-transform duration-200 md:relative md:z-0 md:translate-x-0",
        open ? "translate-x-0" : "-translate-x-full"
      )}
    >
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 md:justify-start">
        <Link href="/dashboard" className="text-lg font-semibold text-white" onClick={onClose}>
          ShiftSync
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const showNotificationBadge = item.href === "/dashboard/notifications" && unreadCount > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={clsx(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                isActive ? "bg-accent/20 text-accent" : "text-muted hover:bg-border/50 hover:text-gray-200"
              )}
            >
              <span className="relative shrink-0">
                <Icon className="h-4 w-4" />
                {showNotificationBadge && (
                  <span
                    className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white"
                    aria-label={`${unreadCount} unread notifications`}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={() => logout()}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted transition-colors hover:bg-border/50 hover:text-gray-200"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className="truncate">Log out</span>
        </button>
      </div>
    </aside>
  );
}
