import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { STAFF, getShiftsForStaff, LOCATIONS } from "@/lib/mock-data";

interface PageProps {
  searchParams: Promise<{ role?: string; userId?: string }>;
}

// Mock: project hours from assigned shifts (simplified)
function projectHours(staffId: string): { hours: number; warning?: string } {
  const shifts = getShiftsForStaff(staffId);
  const total = shifts.length * 7; // mock ~7h per shift
  if (total >= 40) return { hours: total, warning: "Overtime" };
  if (total >= 35) return { hours: total, warning: "Approaching 40h" };
  return { hours: total };
}

export default async function OvertimePage({ searchParams }: PageProps) {
  const { role, userId } = await searchParams;
  const currentUser = userId ? STAFF.find((s) => s.id === userId) : null;
  const managerLocationIds = currentUser?.role === "manager" ? currentUser.locationIds : [];
  const staffToShow =
    role === "manager" && managerLocationIds.length
      ? STAFF.filter(
          (s) => s.role === "staff" && s.locationIds.some((lid) => managerLocationIds.includes(lid))
        )
      : STAFF.filter((s) => s.role === "staff");

  const rows = staffToShow.map((s) => ({
    ...s,
    ...projectHours(s.id),
  }));

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Overtime</h1>
      <Card>
        <CardHeader>Projected weekly hours {role === "manager" && "(my locations)"}</CardHeader>
        <Table>
          <TableHead>
            <TableRow>
              <Th>Staff</Th>
              <Th>Projected hours</Th>
              <Th>Status</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <Td>{r.name}</Td>
                <Td>{r.hours}h</Td>
                <Td>
                  {r.warning === "Overtime" && <Badge variant="danger">Overtime</Badge>}
                  {r.warning === "Approaching 40h" && <Badge variant="warning">Approaching 40h</Badge>}
                  {!r.warning && <span className="text-muted">OK</span>}
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
