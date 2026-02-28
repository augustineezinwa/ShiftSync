import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { STAFF, SKILLS, LOCATIONS, getStaff } from "@/lib/mock-data";

interface PageProps {
  searchParams: Promise<{ role?: string; userId?: string }>;
}

export default async function StaffPage({ searchParams }: PageProps) {
  const { role, userId } = await searchParams;
  const currentUser = userId ? getStaff(userId) : null;
  const managerLocationIds = currentUser?.role === "manager" ? currentUser.locationIds : [];
  const staffList = role === "manager" && managerLocationIds.length
    ? STAFF.filter(
        (s) =>
          s.role === "staff" && s.locationIds.some((lid) => managerLocationIds.includes(lid))
      )
    : STAFF.filter((s) => s.role === "staff");

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Staff</h1>
      <Card>
        <CardHeader>Staff {role === "manager" && "(at my locations)"}</CardHeader>
        <Table>
          <TableHead>
            <TableRow>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Locations</Th>
              <Th>Skills</Th>
              <Th>Desired hrs/wk</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {staffList.map((s) => (
              <TableRow key={s.id}>
                <Td>{s.name}</Td>
                <Td className="text-muted">{s.email}</Td>
                <Td>
                  {s.locationIds.map((lid) => LOCATIONS.find((l) => l.id === lid)?.name ?? lid).join(", ")}
                </Td>
                <Td>
                  {s.skillIds.map((sid) => (
                    <Badge key={sid} variant="muted" className="mr-1">
                      {SKILLS.find((k) => k.id === sid)?.name ?? sid}
                    </Badge>
                  ))}
                </Td>
                <Td>{s.desiredHoursPerWeek ?? "—"}</Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
