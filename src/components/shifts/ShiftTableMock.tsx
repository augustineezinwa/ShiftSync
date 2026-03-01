"use client";

import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { getLocation, getSkill, getStaff, type Shift } from "@/lib/mock-data";

export interface ShiftTableMockProps {
  shifts: Shift[];
  showLocation?: boolean;
}

export function ShiftTableMock({ shifts, showLocation = true }: ShiftTableMockProps) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          {showLocation && <Th>Location</Th>}
          <Th>Date</Th>
          <Th>Time</Th>
          <Th>Skill</Th>
          <Th>Headcount</Th>
          <Th>Assigned</Th>
          <Th>Status</Th>
          <Th className="w-20">Action</Th>
        </TableRow>
      </TableHead>
      <TableBody>
        {shifts.map((s) => {
          const loc = getLocation(s.locationId);
          const skill = getSkill(s.skillId);
          const assigned = s.assignedStaffIds
            .map((id) => getStaff(id)?.name)
            .filter(Boolean)
            .join(", ") || "—";
          return (
            <TableRow key={s.id}>
              {showLocation && <Td>{loc?.name ?? s.locationId}</Td>}
              <Td>{s.date}</Td>
              <Td>
                {s.startTime} – {s.endTime}
              </Td>
              <Td>{skill?.name ?? s.skillId}</Td>
              <Td>{s.headcount}</Td>
              <Td>{assigned}</Td>
              <Td>
                <Badge variant={s.status === "published" ? "success" : "muted"}>
                  {s.status}
                </Badge>
                {s.isPremium && (
                  <Badge variant="warning" className="ml-1">
                    Premium
                  </Badge>
                )}
              </Td>
              <Td>
                <Button variant="ghost" size="sm">
                  View
                </Button>
              </Td>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
