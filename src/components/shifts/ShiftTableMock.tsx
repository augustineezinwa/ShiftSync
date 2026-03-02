"use client";

import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { getLocation, getSkill, getStaff, type Shift } from "@/lib/mock-data";

export interface ShiftTableMockProps {
  shifts: Shift[];
  showLocation?: boolean;
}

function isPremiumMockShift(dateStr: string, startTime: string, endTime: string): boolean {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  const isFriday = weekday === "Fri";
  const isSaturday = weekday === "Sat";
  if (!isFriday && !isSaturday) return false;
  const [endHourStr, endMinuteStr = "0"] = endTime.split(":");
  const endHour = parseInt(endHourStr, 10);
  const endMinute = parseInt(endMinuteStr, 10);
  const minutesSinceMidnight = endHour * 60 + endMinute;
  const eveningStartMinutes = 17 * 60; // 17:00
  return minutesSinceMidnight >= eveningStartMinutes;
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
          const premium = isPremiumMockShift(s.date, s.startTime, s.endTime);
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
                {premium && (
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
