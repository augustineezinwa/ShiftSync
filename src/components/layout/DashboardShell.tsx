"use client";

import { useAuth } from "@/providers/AuthProvider";
import { DashboardLayout } from "./DashboardLayout";

const VALID_ROLES = ["admin", "manager", "staff"] as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (!user && !isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="text-center">
          <p className="text-muted">Sign in to continue.</p>
          <a href="/" className="mt-2 inline-block text-accent hover:underline">
            ← Back to login
          </a>
        </div>
      </div>
    );
  }

  const role = user && VALID_ROLES.includes(user.role as (typeof VALID_ROLES)[number])
    ? (user.role as "admin" | "manager" | "staff")
    : "staff";

  return (
    <DashboardLayout role={role} userId={user ? String(user.id) : null} loading={isLoading && !user}>
      {children}
    </DashboardLayout>
  );
}
