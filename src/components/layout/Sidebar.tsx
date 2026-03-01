"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { logout } from "@/lib/api";
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
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell, roles: ["admin", "manager", "staff"] },
  { href: "/dashboard/profile", label: "Profile", icon: UserCircle, roles: ["admin", "manager", "staff"] },
];

interface SidebarProps {
  role: Role;
  query?: string;
}

export function Sidebar({ role, query = "" }: SidebarProps) {
  const pathname = usePathname();
  const items = navItems.filter((item) => item.roles.includes(role));

  return (
    <aside className="flex w-52 flex-col border-r border-border bg-surfaceElevated">
      <div className="border-b border-border p-4">
        <Link href="/" className="text-lg font-semibold text-white">
          ShiftSync
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 p-2">
        {items.map((item) => {
          const Icon = item.icon;
          const href = `${item.href}${query}`;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={href}
              className={clsx(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                isActive ? "bg-accent/20 text-accent" : "text-muted hover:bg-border/50 hover:text-gray-200"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
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
          Log out
        </button>
      </div>
    </aside>
  );
}
