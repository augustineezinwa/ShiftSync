import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { SectionFilters } from "@/components/dashboard/SectionFilters";
import { STAFF, getOvertimeProjections, type OvertimeStatus, type Role } from "@/lib/mock-data";

interface PageProps {
  searchParams: Promise<{ role?: string; userId?: string; locations?: string; dateFrom?: string; dateTo?: string }>;
}

function StatusCell({ status }: { status: OvertimeStatus }) {
  if (status === "ok") return <span className="text-success">✅ OK</span>;
  if (status === "over") return <span className="text-danger">🔴 Over</span>;
  if (status === "caution") return <span className="text-warning">⚠️ Caution</span>;
  return null;
}

export default async function OvertimePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { role, userId, locations: locationsParam } = params;
  const currentUser = userId ? STAFF.find((s) => s.id === userId) : null;
  const managerLocationIds = currentUser?.role === "manager" ? currentUser.locationIds : undefined;
  const locationIds = locationsParam ? locationsParam.split(",").filter(Boolean) : managerLocationIds;
  const rows = getOvertimeProjections(locationIds);

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Overtime</h1>
      <SectionFilters role={role as Role} userId={userId} />
      <Card>
        <CardHeader>Projected weekly hours {role === "manager" && "(my locations)"}</CardHeader>
        <Table>
          <TableHead>
            <TableRow>
              <Th>Staff Name</Th>
              <Th>Projected Hours</Th>
              <Th>Status</Th>
              <Th>Notes / Warnings</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.staffId}>
                <Td className="font-medium text-gray-100">{r.name}</Td>
                <Td>{r.projectedHours}h</Td>
                <Td>
                  <StatusCell status={r.status} />
                </Td>
                <Td className="text-muted">{r.notes}</Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length === 0 && (
          <p className="p-4 text-center text-muted">No staff with projected hours in this period.</p>
        )}
      </Card>
    </>
  );
}
