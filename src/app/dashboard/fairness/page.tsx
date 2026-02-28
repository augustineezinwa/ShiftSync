import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { STAFF, getShiftsForStaff } from "@/lib/mock-data";

interface PageProps {
  searchParams: Promise<{ role?: string; userId?: string }>;
}

export default async function FairnessPage({ searchParams }: PageProps) {
  const { role, userId } = await searchParams;
  const currentUser = userId ? STAFF.find((s) => s.id === userId) : null;
  const managerLocationIds = currentUser?.role === "manager" ? currentUser.locationIds : [];
  const staffList =
    role === "manager" && managerLocationIds.length
      ? STAFF.filter(
          (s) => s.role === "staff" && s.locationIds.some((lid) => managerLocationIds.includes(lid))
        )
      : STAFF.filter((s) => s.role === "staff");

  const rows = staffList.map((s) => {
    const myShifts = getShiftsForStaff(s.id);
    const premiumCount = myShifts.filter((sh) => sh.isPremium).length;
    const totalHours = myShifts.length * 7;
    const desired = s.desiredHoursPerWeek ?? 0;
    const status =
      totalHours < desired - 5 ? "under" : totalHours > desired + 5 ? "over" : "ok";
    return {
      name: s.name,
      assignedHours: totalHours,
      desiredHours: desired,
      premiumShifts: premiumCount,
      status,
    };
  });

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Fairness</h1>
      <Card className="mb-6">
        <CardHeader>Premium shift distribution (Fri/Sat evening)</CardHeader>
        <p className="text-sm text-muted mb-3">
          Fairness score: equitable when premium shifts are distributed evenly.
        </p>
        <Table>
          <TableHead>
            <TableRow>
              <Th>Staff</Th>
              <Th>Assigned hrs</Th>
              <Th>Desired hrs</Th>
              <Th>Premium shifts</Th>
              <Th>Status</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.name}>
                <Td>{r.name}</Td>
                <Td>{r.assignedHours}h</Td>
                <Td>{r.desiredHours}h</Td>
                <Td>{r.premiumShifts}</Td>
                <Td>
                  {r.status === "under" && <Badge variant="warning">Under-scheduled</Badge>}
                  {r.status === "over" && <Badge variant="danger">Over desired</Badge>}
                  {r.status === "ok" && <Badge variant="success">OK</Badge>}
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
