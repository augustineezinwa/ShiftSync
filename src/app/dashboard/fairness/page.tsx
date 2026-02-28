import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { SectionFilters } from "@/components/dashboard/SectionFilters";
import { STAFF, getFairnessRows, type FairnessStatus, type Role } from "@/lib/mock-data";

const STATUS_LABELS: Record<FairnessStatus, string> = {
  under: "Under-scheduled",
  even: "Normal",
  over: "Overscheduled",
};

const STATUS_VARIANTS: Record<FairnessStatus, "warning" | "success" | "danger"> = {
  under: "warning",
  even: "success",
  over: "danger",
};

interface PageProps {
  searchParams: Promise<{ role?: string; userId?: string; locations?: string; dateFrom?: string; dateTo?: string }>;
}

export default async function FairnessPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { role, userId, locations: locationsParam, dateFrom, dateTo } = params;
  const currentUser = userId ? STAFF.find((s) => s.id === userId) : null;
  const managerLocationIds = currentUser?.role === "manager" ? currentUser.locationIds : undefined;
  const locationIds = locationsParam ? locationsParam.split(",").filter(Boolean) : managerLocationIds;
  const rows = getFairnessRows(locationIds, dateFrom, dateTo);

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Fairness</h1>
      <SectionFilters role={role as Role} userId={userId} />
      <Card className="mb-6">
        <CardHeader>Premium shift distribution (Fri/Sat evening)</CardHeader>
        <p className="mb-3 text-sm text-muted">
          Team median = median of premium shift counts at this location. Premium diff = team median −
          premium shifts. Status is from premium diff (under-scheduled / normal / overscheduled).
        </p>
        <Table>
          <TableHead>
            <TableRow>
              <Th>Location</Th>
              <Th>Staff</Th>
              <Th>Assigned hrs</Th>
              <Th>Desired hrs</Th>
              <Th>Premium shifts</Th>
              <Th>Team median</Th>
              <Th>Premium diff</Th>
              <Th>Status</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={`${r.staffId}-${r.locationId}`}>
                <Td>{r.locationName}</Td>
                <Td className="font-medium text-gray-100">{r.staffName}</Td>
                <Td>{r.assignedHours}h</Td>
                <Td>{r.desiredHours}h</Td>
                <Td>{r.premiumShifts}</Td>
                <Td>{r.teamMedian}</Td>
                <Td>{r.premiumDiff >= 0 ? `+${r.premiumDiff}` : r.premiumDiff}</Td>
                <Td>
                  <Badge variant={STATUS_VARIANTS[r.status]}>
                    {STATUS_LABELS[r.status]}
                  </Badge>
                </Td>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {rows.length === 0 && (
          <p className="p-4 text-center text-muted">No staff in selected locations.</p>
        )}
      </Card>
    </>
  );
}
