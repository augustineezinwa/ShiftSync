"use client";

import { useSearchParams } from "next/navigation";
import { DashboardLayout } from "./DashboardLayout";

const VALID_ROLES = ["admin", "manager", "staff"] as const;
const DEFAULT_USER_IDS: Record<string, string> = {
  admin: "u1",
  manager: "u2",
  staff: "u4",
};

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const roleParam = searchParams.get("role");
  const userId = searchParams.get("userId") ?? (roleParam ? DEFAULT_USER_IDS[roleParam] : null);
  const role = roleParam && VALID_ROLES.includes(roleParam as (typeof VALID_ROLES)[number])
    ? (roleParam as "admin" | "manager" | "staff")
    : null;

  if (!role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <p className="text-muted">Select a role to continue.</p>
          <a href="/" className="mt-2 inline-block text-accent hover:underline">
            ← Back to home
          </a>
        </div>
      </div>
    );
  }

  const query = "?" + searchParams.toString();
  return (
    <DashboardLayout role={role} userId={userId} query={query}>
      {children}
    </DashboardLayout>
  );
}
