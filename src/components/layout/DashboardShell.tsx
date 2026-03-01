"use client";

import { useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { DashboardLayout } from "./DashboardLayout";

const VALID_ROLES = ["admin", "manager", "staff"] as const;

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const searchParams = useSearchParams();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  if (!user) {
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

  const role = VALID_ROLES.includes(user.role as (typeof VALID_ROLES)[number])
    ? (user.role as "admin" | "manager" | "staff")
    : "staff";
  const userId = String(user.id);
  const query = "?" + searchParams.toString();
  return (
    <DashboardLayout role={role} userId={userId} query={query}>
      {children}
    </DashboardLayout>
  );
}
