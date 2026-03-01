"use client";

import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { formatShiftDateInTz, formatShiftTimeInTz, isPremiumShift } from "@/lib/shift-utils";
import type { ApiShift } from "@/lib/api";
import { Pencil, Trash2 } from "lucide-react";

const DEFAULT_TIMEZONE = "UTC";

export interface ShiftTableApiProps {
  shifts: ApiShift[];
  showLocation?: boolean;
  onAssignClick?: (shift: ApiShift) => void;
  onDeleteClick?: (shift: ApiShift) => void;
  deletingId?: number | null;
  disableActions?: boolean;
}

export function ShiftTableApi({
  shifts,
  showLocation = true,
  onAssignClick,
  onDeleteClick,
  deletingId,
  disableActions = false,
}: ShiftTableApiProps) {
  const showActions = disableActions || !!onAssignClick || !!onDeleteClick;
  const showAssignBtn = onAssignClick != null || disableActions;
  const showDeleteBtn = onDeleteClick != null || disableActions;
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
          <Th>Assign</Th>
        </TableRow>
      </TableHead>
      <TableBody>
        {shifts.map((s) => {
          const tz = s.location?.timezone ?? DEFAULT_TIMEZONE;
          const premium = isPremiumShift(s.startTime, tz);
          const isDeleting = deletingId === s.id;
          return (
            <TableRow key={s.id}>
              {showLocation && (
                <Td className="font-medium text-white">
                  {s.location?.name ?? s.locationId}
                </Td>
              )}
              <Td>{formatShiftDateInTz(s.startTime, tz)}</Td>
              <Td>
                {formatShiftTimeInTz(s.startTime, tz)} – {formatShiftTimeInTz(s.endTime, tz)}
              </Td>
              <Td>{s.skill?.name ?? s.skillId}</Td>
              <Td>{s.headcount ?? "—"}</Td>
              <Td>
                {(s.users ?? []).length > 0
                  ? (s.users ?? []).map((u: { name: string }) => u.name).join(", ")
                  : "—"}
              </Td>
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
                {showActions && (
                  <div className="flex items-center gap-1">
                    {showAssignBtn && (
                      <button
                        type="button"
                        onClick={disableActions ? undefined : () => onAssignClick?.(s)}
                        disabled={disableActions}
                        className="rounded p-1.5 text-muted transition-colors hover:bg-border/50 hover:text-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Assign staff to shift"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    )}
                    {showDeleteBtn && (
                      <button
                        type="button"
                        onClick={disableActions ? undefined : () => onDeleteClick?.(s)}
                        disabled={isDeleting || disableActions}
                        className="rounded p-1.5 text-muted transition-colors hover:bg-red-500/20 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Delete shift"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )}
              </Td>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
