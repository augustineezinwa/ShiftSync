"use client";

import { useAuth } from "@/providers/AuthProvider";
import { StaffShiftsView } from "./StaffShiftsView";
import { ManagerShiftsView } from "./ManagerShiftsView";
import { AllShiftsView } from "./AllShiftsView";

export default function ShiftsPage() {
  const { user, isLoading } = useAuth();
  const role = user?.role ?? "staff";
  const isStaff = role === "staff";
  const isManager = role === "manager";

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <p className="text-muted">Sign in to view shifts.</p>
    );
  }

  if (isStaff) {
    return <StaffShiftsView />;
  }

  if (isManager) {
    return <ManagerShiftsView />;
  }

  return <AllShiftsView />;
}
