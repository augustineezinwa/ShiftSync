"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import {
  getManagerRequests,
  updateMyRequestStatus,
  type MyRequest,
} from "@/lib/api";

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

const getStatusVariant = (status: string): "default" | "success" | "warning" | "danger" | "muted" => {
  const s = status.toLowerCase();
  if (s.includes("pending")) return "warning";
  if (s === "accepted") return "success";
  if (s === "rejected") return "danger";
  if (s === "cancelled") return "muted";
  return "default";
};

const formatStatusLabel = (status: string) => status.replace(/_/g, " ");

export function ManagerSwapRequestsView() {
  const [requests, setRequests] = useState<MyRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getManagerRequests()
      .then((list) => {
        setRequests(Array.isArray(list) ? list : []);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load requests");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateStatus = async (id: number, status: "accepted" | "rejected") => {
    setUpdatingId(id);
    setError(null);
    try {
      await updateMyRequestStatus(id, status);
      const list = await getManagerRequests();
      setRequests(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update request");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>Pending approval</CardHeader>
      {error && <p className="px-4 pb-2 text-sm text-red-500">{error}</p>}
      <Table>
        <TableHead>
          <TableRow>
            <Th>Type</Th>
            <Th>Shift</Th>
            <Th>Requester</Th>
            <Th>Receiver</Th>
            <Th>Status</Th>
            <Th className="w-32">Action</Th>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.length === 0 ? (
            <TableRow>
              <td colSpan={6} className="px-4 py-3 text-center text-sm text-muted">
                {loading ? "Loading requests…" : "No requests pending approval."}
              </td>
            </TableRow>
          ) : (
            requests.map((r) => (
              <TableRow key={r.id}>
                <Td className="capitalize">{r.type}</Td>
                <Td>
                  {r.shift
                    ? formatShiftTimeRange(
                        r.shift.startTime as string | Date,
                        r.shift.endTime as string | Date,
                        r.shift.location?.timezone ?? "UTC"
                      )
                    : `Shift ${r.shiftId ?? r.id}`}
                </Td>
                <Td>{r.requester?.name ?? r.requesterId}</Td>
                <Td>{r.targetUser ? r.targetUser.name : "—"}</Td>
                <Td>
                  <Badge variant={getStatusVariant(r.status)}>{formatStatusLabel(r.status)}</Badge>
                </Td>
                <Td>
                  {r.status === "pending_manager_approval" ? (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="mr-1"
                        disabled={updatingId === r.id}
                        onClick={() => handleUpdateStatus(r.id, "accepted")}
                      >
                        {updatingId === r.id ? "Updating…" : "Approve"}
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={updatingId === r.id}
                        onClick={() => handleUpdateStatus(r.id, "rejected")}
                      >
                        {updatingId === r.id ? "Updating…" : "Reject"}
                      </Button>
                    </div>
                  ) : null}
                </Td>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
