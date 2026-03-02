"use client";

import { useAuth } from "@/providers/AuthProvider";
import { ManagerSwapRequestsView } from "./ManagerSwapRequestsView";
import { StaffSwapRequestsView } from "./StaffSwapRequestsView";
import { DefaultSwapRequestsView } from "./DefaultSwapRequestsView";

export default function SwapRequestsPage() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <p className="text-muted">Loading…</p>;
  }

  if (!user) {
    return <p className="text-muted">Sign in to view swap / drop requests.</p>;
  }

  const role = user.role;
  const isManager = role === "manager";
  const isStaff = role === "staff";

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Swap / Drop requests</h1>
      {isManager ? (
        <ManagerSwapRequestsView />
      ) : isStaff ? (
        <StaffSwapRequestsView user={user} />
      ) : (
        <DefaultSwapRequestsView />
      )}
    </>
  );
}
