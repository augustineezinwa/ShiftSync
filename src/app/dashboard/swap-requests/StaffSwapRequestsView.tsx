"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  createMyRequest,
  getMyRequests,
  getMyShifts,
  getMyQualifiedShifts,
  getQualifiedUsersForShift,
  type ApiShift,
  type AuthUser,
  type MyRequest,
  updateMyRequestStatus,
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

export function StaffSwapRequestsView({ user }: { user: AuthUser }) {
  const [myShifts, setMyShifts] = useState<ApiShift[]>([]);
  const [myRequests, setMyRequests] = useState<MyRequest[]>([]);
  const [selectedShiftId, setSelectedShiftId] = useState<string>("");
  const [requestType, setRequestType] = useState<"swap" | "drop">("swap");
  const [qualifiedUsers, setQualifiedUsers] = useState<{ id: number; name: string }[]>([]);
  const [selectedTargetUserId, setSelectedTargetUserId] = useState<string>("");
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [loadingQualified, setLoadingQualified] = useState(false);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [updatingRequestId, setUpdatingRequestId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    setLoadingShifts(true);
    setError(null);
    const load = requestType === "swap" ? getMyQualifiedShifts : getMyShifts;
    load()
      .then((list) => {
        setMyShifts(Array.isArray(list) ? list : []);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load shifts");
      })
      .finally(() => setLoadingShifts(false));
  }, [requestType]);

  useEffect(() => {
    setLoadingRequests(true);
    setError(null);
    getMyRequests()
      .then((list) => {
        setMyRequests(Array.isArray(list) ? list : []);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load requests");
      })
      .finally(() => setLoadingRequests(false));
  }, [user.id]);

  useEffect(() => {
    if (!selectedShiftId) {
      setQualifiedUsers([]);
      setSelectedTargetUserId("");
      return;
    }
    setLoadingQualified(true);
    setError(null);
    getQualifiedUsersForShift(Number(selectedShiftId))
      .then((list) => {
        const arr = Array.isArray(list) ? list : [];
        const filtered = arr
          .filter((u: { id: number }) => u.id !== user.id)
          .map((u: { id: number; name: string }) => ({ id: u.id, name: u.name }));
        setQualifiedUsers(filtered);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load qualified users");
        setQualifiedUsers([]);
      })
      .finally(() => setLoadingQualified(false));
  }, [selectedShiftId, user.id]);

  const formatShiftLabel = (shift: ApiShift) => {
    const tz = shift.location?.timezone ?? "UTC";
    return formatShiftTimeRange(
      shift.startTime as string | Date,
      shift.endTime as string | Date,
      tz
    );
  };

  const formatRequestShift = (request: MyRequest) => {
    const shift = request.userShift?.shift;
    if (!shift) {
      return `Shift ${request.userShiftId}`;
    }
    const tz = shift.location?.timezone ?? "UTC";
    return formatShiftTimeRange(
      shift.startTime as string | Date,
      shift.endTime as string | Date,
      tz
    );
  };

  const getStatusVariant = (status: string): "default" | "success" | "warning" | "danger" | "muted" => {
    const s = status.toLowerCase();
    if (s.includes("pending")) return "warning";
    if (s === "approved") return "success";
    if (s === "rejected") return "danger";
    if (s === "cancelled") return "muted";
    return "default";
  };

  const formatStatusLabel = (status: string) => {
    return status.replace(/_/g, " ");
  };

  const handleSubmit = async () => {
    if (!selectedShiftId) {
      setError("Please select a shift.");
      return;
    }
    if (requestType === "swap" && !selectedTargetUserId) {
      setError("Please select a user to swap with.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await createMyRequest({
        type: requestType,
        userShiftId: Number(selectedShiftId),
        requesterId: user.id,
        targetUserId: requestType === "swap" ? Number(selectedTargetUserId) : undefined,
      });
      setSuccess("Request submitted.");
      setSelectedTargetUserId("");
      setSelectedShiftId("");
      setFormOpen(false);
      // Refresh list so the new request appears
      setLoadingRequests(true);
      getMyRequests()
        .then((list) => {
          setMyRequests(Array.isArray(list) ? list : []);
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : "Failed to load requests");
        })
        .finally(() => setLoadingRequests(false));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create request");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: number, status: "cancelled" | "pending_manager_approval" | "rejected") => {
    setUpdatingRequestId(id);
    setError(null);
    setSuccess(null);
    try {
      await updateMyRequestStatus(id, status);
      // Refresh after update
      const list = await getMyRequests();
      setMyRequests(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update request");
    } finally {
      setUpdatingRequestId(null);
    }
  };

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => {
          setError(null);
          setSuccess(null);
          setSelectedShiftId("");
          setSelectedTargetUserId("");
          setFormOpen(true);
        }}>
          New request
        </Button>
      </div>
      <Modal
        open={formOpen}
        onClose={() => {
          if (submitting) return;
          setFormOpen(false);
        }}
        title="Request swap / drop shift"
      >
        <div className="space-y-4">
          {error && <p className="text-sm text-red-500">{error}</p>}
          {success && <p className="text-sm text-green-500">{success}</p>}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-muted">Request type</label>
              <select
                value={requestType}
                onChange={(e) => {
                  const v = e.target.value === "drop" ? "drop" : "swap";
                  setRequestType(v);
                  setSelectedShiftId("");
                  setSelectedTargetUserId("");
                }}
                className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="swap">Swap</option>
                <option value="drop">Drop</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Shift</label>
              <select
                value={selectedShiftId}
                onChange={(e) => {
                  setSelectedShiftId(e.target.value);
                  setSelectedTargetUserId("");
                }}
                disabled={loadingShifts || myShifts.length === 0}
                className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
              >
                <option value="">Select a shift…</option>
                {myShifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {formatShiftLabel(shift)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">User</label>
            <select
              value={selectedTargetUserId}
              onChange={(e) => setSelectedTargetUserId(e.target.value)}
              disabled={requestType === "drop" || loadingQualified || qualifiedUsers.length === 0}
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
            >
              <option value="">
                {requestType === "drop" ? "Not required for drop" : "Select a user…"}
              </option>
              {qualifiedUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                if (submitting) return;
                setFormOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || loadingShifts || !selectedShiftId}>
              {submitting ? "Submitting…" : "Request"}
            </Button>
          </div>
        </div>
      </Modal>
      <Card>
        <CardHeader>My requests</CardHeader>
        <Table>
          <TableHead>
            <TableRow>
              <Th>Type</Th>
              <Th>Shift</Th>
              <Th>Requester</Th>
              <Th>Receiver</Th>
              <Th>Status</Th>
              <Th className="w-24">Action</Th>
            </TableRow>
          </TableHead>
          <TableBody>
            {myRequests.length === 0 ? (
              <TableRow>
                <Td colSpan={6} className="py-4 text-center text-sm text-muted">
                  {loadingRequests ? "Loading requests…" : "No requests yet."}
                </Td>
              </TableRow>
            ) : (
              myRequests.map((r) => (
                <TableRow key={r.id}>
                  <Td className="capitalize">{r.type}</Td>
                  <Td>{formatRequestShift(r)}</Td>
                  <Td>{r.requester?.name ?? r.requesterId}</Td>
                  <Td>{r.targetUser ? r.targetUser.name : "—"}</Td>
                  <Td>
                    <Badge variant={getStatusVariant(r.status)}>{formatStatusLabel(r.status)}</Badge>
                  </Td>
                  <Td>
                    {(() => {
                      const isRequester = r.requesterId === user.id;
                      const isReceiver = r.targetUserId === user.id;
                      const status = r.status.toLowerCase();
                      const isPending = status === "pending";
                      const isUpdating = updatingRequestId === r.id;

                      // Requester can only cancel when status is pending
                      if (isRequester && isPending) {
                        return (
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(r.id, "cancelled")}
                          >
                            {isUpdating ? "Updating…" : "Cancel"}
                          </Button>
                        );
                      }

                      // Receiver can accept (→ pending_manager_approval) or reject when pending
                      if (isReceiver && isPending) {
                        return (
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(r.id, "pending_manager_approval")}
                            >
                              {isUpdating ? "Updating…" : "Accept"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={isUpdating}
                              onClick={() => handleUpdateStatus(r.id, "rejected")}
                            >
                              {isUpdating ? "Updating…" : "Reject"}
                            </Button>
                          </div>
                        );
                      }

                      return null;
                    })()}
                  </Td>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
