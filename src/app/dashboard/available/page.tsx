 "use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { getMyPickupRequests, updateMyRequestStatus, type PickupRequest } from "@/lib/api";

const formatShiftTimeRange = (
  startInput: string | Date,
  endInput: string | Date,
  timeZone: string
) => {
  const start = new Date(startInput);
  const end = new Date(endInput);
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
  }).format(start);
  const dateStr = new Intl.DateTimeFormat("en-US", {
    timeZone,
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(start);
  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const startStr = timeFormatter.format(start);
  const endStr = timeFormatter.format(end);
  return `${weekday} ${dateStr} ${startStr} - ${endStr}`;
};

export default function AvailableShiftsPage() {
  const [requests, setRequests] = useState<PickupRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getMyPickupRequests()
      .then((list) => {
        setRequests(Array.isArray(list) ? list : []);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load pick-up requests");
      })
      .finally(() => setLoading(false));
  }, []);

  const handlePick = async (id: number) => {
    setUpdatingId(id);
    setError(null);
    try {
      await updateMyRequestStatus(id, "pending_manager_approval");
      const list = await getMyPickupRequests();
      setRequests(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to pick up shift");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Pick up shifts</h1>
      <Card>
        <CardHeader>Shifts you can pick up (matching your skills & locations)</CardHeader>
        {error && <p className="px-4 pb-2 text-sm text-red-500">{error}</p>}
        <Table>
          <TableHead>
            <TableRow>
              <Th>Location</Th>
              <Th>Shift</Th>
              <Th>Requester</Th>
              <Th>Status</Th>
              <Th className="w-24">Action</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.length === 0 ? (
              <TableRow>
                <td colSpan={4} className="px-4 py-3 text-center text-sm text-muted">
                  {loading ? "Loading…" : "No shifts available to pick up."}
                </td>
              </TableRow>
            ) : (
              requests.map((r) => {
                const shift: any = r.shift;
                const locationName = shift?.location?.name ?? shift?.locationId ?? "—";
                const tz = shift?.location?.timezone ?? "UTC";
                const statusLower = r.status.toLowerCase();
                const statusVariant =
                  statusLower.includes("pending")
                    ? "warning"
                    : statusLower === "accepted"
                    ? "success"
                    : statusLower === "rejected"
                    ? "danger"
                    : statusLower === "cancelled"
                    ? "muted"
                    : "default";
                const statusLabel = r.status.replace(/_/g, " ");
                const isPendingManager = r.status === "pending_manager_approval";
                return (
                  <TableRow key={r.id}>
                    <Td>{locationName}</Td>
                    <Td>
                      {shift
                        ? formatShiftTimeRange(
                            shift.startTime as string | Date,
                            shift.endTime as string | Date,
                            tz
                          )
                        : `Shift ${r.shiftId ?? r.id}`}
                    </Td>
                    <Td>{r.requester?.name ?? r.requesterId}</Td>
                    <Td>
                      <Badge variant={statusVariant as any}>{statusLabel}</Badge>
                    </Td>
                    <Td>
                      <Button
                        size="sm"
                        disabled={updatingId === r.id || isPendingManager}
                        onClick={() => handlePick(r.id)}
                      >
                        {updatingId === r.id ? "Picking…" : "Pick"}
                      </Button>
                    </Td>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
