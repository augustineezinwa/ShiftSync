import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { getAvailableShifts, getLocation, getSkill } from "@/lib/mock-data";

interface PageProps {
  searchParams: Promise<{ userId?: string }>;
}

export default async function AvailableShiftsPage({ searchParams }: PageProps) {
  const { userId } = await searchParams;
  const shifts = userId ? getAvailableShifts(userId) : [];

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Pick up shifts</h1>
      <Card>
        <CardHeader>Shifts you can pick up (published, matching your skills & locations)</CardHeader>
        <Table>
          <TableHead>
            <TableRow>
              <Th>Location</Th>
              <Th>Date</Th>
              <Th>Time</Th>
              <Th>Skill</Th>
              <Th>Spots</Th>
              <Th className="w-20">Action</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {shifts.map((s) => {
              const loc = getLocation(s.locationId);
              const skill = getSkill(s.skillId);
              const spots = s.headcount - s.assignedStaffIds.length;
              return (
                <TableRow key={s.id}>
                  <Td>{loc?.name ?? s.locationId}</Td>
                  <Td>{s.date}</Td>
                  <Td>{s.startTime} – {s.endTime}</Td>
                  <Td>{skill?.name ?? s.skillId}</Td>
                  <Td>{spots}</Td>
                  <Td><Button size="sm">Pick up</Button></Td>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        {shifts.length === 0 && (
          <p className="p-4 text-center text-muted">No available shifts right now.</p>
        )}
      </Card>
    </>
  );
}
