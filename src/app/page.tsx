import Link from "next/link";
import { Shield, UserCog, User } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { STAFF } from "@/lib/mock-data";

const roleConfig = [
  { role: "admin" as const, label: "Admin", desc: "Corporate oversight across all locations", icon: Shield, userId: "u1" },
  { role: "manager" as const, label: "Manager", desc: "Run one or more locations, schedule & approve swaps", icon: UserCog, userId: "u2" },
  { role: "staff" as const, label: "Staff", desc: "View shifts, request swaps, pick up shifts", icon: User, userId: "u4" },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface p-6">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-white">ShiftSync</h1>
        <p className="mt-1 text-muted">Coastal Eats — Staff Scheduling</p>
      </div>
      <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-3">
        {roleConfig.map(({ role, label, desc, icon: Icon, userId }) => {
          const user = STAFF.find((s) => s.id === userId);
          return (
            <Link key={role} href={`/dashboard?role=${role}&userId=${userId}`}>
              <Card className="h-full cursor-pointer transition-colors hover:border-accent/50 hover:bg-surfaceElevated/80">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-accent/20 p-2.5">
                    <Icon className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <CardHeader className="mb-0 font-semibold text-white">{label}</CardHeader>
                    <p className="text-xs text-muted">{user?.name ?? desc}</p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-400">{desc}</p>
              </Card>
            </Link>
          );
        })}
      </div>
      <p className="mt-8 text-center text-xs text-muted">Select a role to open the dashboard (MVP — mock data)</p>
    </div>
  );
}
