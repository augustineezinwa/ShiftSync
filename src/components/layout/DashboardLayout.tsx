import { Sidebar } from "./Sidebar";
import type { Role } from "@/lib/mock-data";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: Role;
  userId?: string | null;
  query?: string;
  title?: string;
}

export function DashboardLayout({ children, role, userId, query = "", title }: DashboardLayoutProps) {
  const q = query || (userId ? `?role=${role}&userId=${userId}` : `?role=${role}`);
  return (
    <div className="flex min-h-screen bg-surface">
      <Sidebar role={role} query={q} />
      <main className="flex-1 overflow-auto">
        <div className="mx-auto max-w-6xl p-6">
          {title && (
            <h1 className="mb-6 text-2xl font-semibold text-white">{title}</h1>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
