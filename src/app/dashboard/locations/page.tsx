import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { LOCATIONS, getShiftsForLocation, getStaff } from "@/lib/mock-data";

interface PageProps {
  searchParams: Promise<{ role?: string; userId?: string }>;
}

export default async function LocationsPage({ searchParams }: PageProps) {
  const { role, userId } = await searchParams;
  const currentUser = userId ? getStaff(userId) : null;
  const managerLocationIds = currentUser?.role === "manager" ? currentUser.locationIds : [];
  const locations =
    role === "manager" && managerLocationIds.length
      ? LOCATIONS.filter((l) => managerLocationIds.includes(l.id))
      : LOCATIONS;

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Locations</h1>
      <Card>
        <CardHeader>Locations {role === "manager" && "(mine)"}</CardHeader>
        <Table>
          <TableHead>
            <TableRow>
              <Th>Name</Th>
              <Th>Timezone</Th>
              <Th>Managers</Th>
              <Th>Shifts (sample)</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {locations.map((loc) => {
              const shifts = getShiftsForLocation(loc.id);
              const managers = loc.managerIds.map((id) => getStaff(id)?.name).filter(Boolean).join(", ");
              return (
                <TableRow key={loc.id}>
                  <Td>{loc.name}</Td>
                  <Td>{loc.timezone}</Td>
                  <Td>{managers || "—"}</Td>
                  <Td>{shifts.length}</Td>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
