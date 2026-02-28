import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import {
  SHIFTS,
  getLocation,
  getSkill,
  getStaff,
  getShiftsForStaff,
  LOCATIONS,
} from "@/lib/mock-data";

interface PageProps {
  searchParams: Promise<{ role?: string; userId?: string }>;
}

function ShiftTable({ shifts, showLocation = true }: { shifts: typeof SHIFTS; showLocation?: boolean }) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          {showLocation && <Th>Location</Th>}
          <Th>Date</Th>
          <Th>Time</Th>
          <Th>Skill</Th>
          <Th>Assigned</Th>
<Th>Status</Th>
              <Th className="w-20">Action</Th>
            </TableRow>
      </TableHead>
      <TableBody>
        {shifts.map((s) => {
          const loc = getLocation(s.locationId);
          const skill = getSkill(s.skillId);
          const assigned = s.assignedStaffIds.map((id) => getStaff(id)?.name).filter(Boolean).join(", ") || "—";
          return (
            <TableRow key={s.id}>
              {showLocation && <Td>{loc?.name ?? s.locationId}</Td>}
              <Td>{s.date}</Td>
              <Td>{s.startTime} – {s.endTime}</Td>
              <Td>{skill?.name ?? s.skillId}</Td>
              <Td>{assigned}</Td>
              <Td>
                <Badge variant={s.status === "published" ? "success" : "muted"}>{s.status}</Badge>
                {s.isPremium && <Badge variant="warning" className="ml-1">Premium</Badge>}
              </Td>
              <Td>
                <Button variant="ghost" size="sm">View</Button>
              </Td>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default async function ShiftsPage({ searchParams }: PageProps) {
  const { role, userId } = await searchParams;
  const isStaff = role === "staff";
  const shifts = isStaff && userId ? getShiftsForStaff(userId) : SHIFTS;
  const managerLocationIds = role === "manager" && userId
    ? (() => {
        const u = getStaff(userId);
        return u?.locationIds ?? [];
      })()
    : [];
  const filteredShifts = role === "manager" && managerLocationIds.length
    ? shifts.filter((s) => managerLocationIds.includes(s.locationId))
    : shifts;

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Shifts</h1>
      {isStaff ? (
        <Card>
          <CardHeader>My shifts</CardHeader>
          <ShiftTable shifts={filteredShifts} showLocation={true} />
        </Card>
      ) : (
        <Card>
          <CardHeader>All shifts {role === "manager" && "(my locations)"}</CardHeader>
          <ShiftTable shifts={filteredShifts} showLocation={true} />
          <div className="mt-4">
            <Button>Create shift</Button>
          </div>
        </Card>
      )}
    </>
  );
}
