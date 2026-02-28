import { Suspense } from "react";
import { DashboardShell } from "@/components/layout/DashboardShell";

function DashboardFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-surface">
      <p className="text-muted">Loading…</p>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardShell>{children}</DashboardShell>
    </Suspense>
  );
}
