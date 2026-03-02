"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { getAssignUserStatus } from "@/lib/api";
import { X } from "lucide-react";

export type UserOption = { id: number; name: string };

type RedListItem = { user: UserOption; error: string };

interface AssignUserToShiftModalProps {
  open: boolean;
  onClose: () => void;
  /** Shift id and optional display info for title */
  shiftId: number;
  shiftLabel?: string;
  /** All users that can be assigned (e.g. non-admin staff) */
  users: UserOption[];
  /** Users currently assigned to this shift (shown at top with X to unassign) */
  assignedUsers: UserOption[];
  onAssign: (userIds: number[]) => Promise<void>;
  onUnassign: (userId: number) => Promise<void>;
  isSubmitting?: boolean;
}

export function AssignUserToShiftModal({
  open,
  onClose,
  shiftId,
  shiftLabel,
  users,
  assignedUsers,
  onAssign,
  onUnassign,
  isSubmitting = false,
}: AssignUserToShiftModalProps) {
  const [waitingList, setWaitingList] = useState<UserOption[]>([]);
  const [redList, setRedList] = useState<RedListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [unassigningId, setUnassigningId] = useState<number | null>(null);
  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null);

  useEffect(() => {
    if (open) {
      setWaitingList([]);
      setRedList([]);
      setSelectedId("");
    }
  }, [open]);

  const assignedIds = new Set(assignedUsers.map((u) => u.id));
  const waitingIds = new Set(waitingList.map((u) => u.id));
  const redListIds = new Set(redList.map((r) => r.user.id));
  const availableUsers = users.filter(
    (u) => !assignedIds.has(u.id) && !waitingIds.has(u.id) && !redListIds.has(u.id)
  );

  const addToWaitingList = (user: UserOption) => {
    setWaitingList((prev) => [...prev, user]);
    setSelectedId("");
  };

  const addToRedList = (user: UserOption, error: string) => {
    setRedList((prev) => {
      if (prev.some((r) => r.user.id === user.id)) return prev;
      return [...prev, { user, error }];
    });
    setSelectedId("");
  };

  const removeFromRedList = (userId: number) => {
    setRedList((prev) => prev.filter((r) => r.user.id !== userId));
  };

  const removeFromWaitingList = (id: number) => {
    setWaitingList((prev) => prev.filter((u) => u.id !== id));
  };

  const handleSelectUser = async (userId: number) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    setStatusLoadingId(userId);
    try {
      const result = await getAssignUserStatus(userId, shiftId);
      if (result.ok) {
        addToWaitingList(user);
      } else {
        addToRedList(user, result.error);
      }
    } catch {
      addToRedList(user, "Could not check status");
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleUnassign = async (userId: number) => {
    setUnassigningId(userId);
    try {
      await onUnassign(userId);
    } finally {
      setUnassigningId(null);
    }
  };

  const handleAssign = async () => {
    if (waitingList.length === 0) return;
    await onAssign(waitingList.map((u) => u.id));
    setWaitingList([]);
    onClose();
  };

  const title = shiftLabel ? `Assign staff — ${shiftLabel}` : `Assign staff to shift #${shiftId}`;

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div className="space-y-4">
        {redList.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-red-400">Cannot assign</p>
            <div className="flex w-full flex-col gap-2">
              {redList.map(({ user, error }) => (
                <div
                  key={user.id}
                  className="flex w-full flex-col gap-1 rounded-md border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-red-300">{user.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFromRedList(user.id)}
                      className="rounded p-1 text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300"
                      aria-label={`Dismiss ${user.name}`}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="whitespace-pre-line text-xs text-red-400/90">{error}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {assignedUsers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted">Assigned</p>
            <div className="flex w-full flex-col gap-2">
              {assignedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex w-full items-center justify-between gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-gray-200"
                >
                  <span className="font-medium">{user.name}</span>
                  <button
                    type="button"
                    onClick={() => handleUnassign(user.id)}
                    disabled={unassigningId !== null}
                    className="rounded p-1 text-muted transition-colors hover:bg-white/20 hover:text-white disabled:opacity-50"
                    aria-label={`Unassign ${user.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {waitingList.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted">Selected (click Assign to save)</p>
            <div className="flex w-full flex-col gap-2">
              {waitingList.map((user) => (
                <div
                  key={user.id}
                  className="flex w-full items-center justify-between gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-300"
                >
                  <span className="font-medium">{user.name}</span>
                  <button
                    type="button"
                    onClick={() => removeFromWaitingList(user.id)}
                    className="rounded p-1 text-muted transition-colors hover:bg-white/20 hover:text-white"
                    aria-label={`Remove ${user.name} from list`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="assign-user-pick" className="mb-1 block text-xs text-muted">
            Add user to assign
          </label>
          <select
            id="assign-user-pick"
            value={selectedId}
            onChange={(e) => {
              const id = e.target.value;
              setSelectedId(id);
              if (id) handleSelectUser(Number(id));
            }}
            disabled={statusLoadingId !== null}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-60"
          >
            <option value="">Select a user…</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          {statusLoadingId !== null && (
            <p className="mt-1 text-xs text-muted">Checking…</p>
          )}
          {availableUsers.length === 0 && (
            <p className="mt-1 text-xs text-muted">All users are already assigned or selected.</p>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAssign}
            disabled={isSubmitting || waitingList.length === 0}
          >
            {isSubmitting ? "Assigning…" : "Assign"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
