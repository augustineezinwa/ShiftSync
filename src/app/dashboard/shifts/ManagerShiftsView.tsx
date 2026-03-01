"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/providers/AuthProvider";
import {
  getShifts,
  getSkills,
  createShift,
  getUsers,
  assignUsersToShift,
  unassignUserFromShift,
  publishShifts,
  deleteShift,
  type ApiShift,
  isValidationError,
} from "@/lib/api";
import { ShiftModal, type ShiftFormValues } from "@/components/shifts/ShiftModal";
import { AssignUserToShiftModal } from "@/components/shifts/AssignUserToShiftModal";
import { ShiftTableApi } from "@/components/shifts/ShiftTableApi";
import { formatShiftDateInTz } from "@/lib/shift-utils";
import {
  getUpcomingWeekRanges,
  formatWeekRangeLabel,
  weekRangeToValue,
  valueToWeekRange,
  CURRENT_WEEK_INDEX,
  type WeekRange,
} from "@/lib/week-ranges";
import { Plus } from "lucide-react";

const DEFAULT_TIMEZONE = "UTC";
const WEEK_OPTIONS = getUpcomingWeekRanges();
const DEFAULT_WEEK_VALUE = WEEK_OPTIONS[CURRENT_WEEK_INDEX] ? weekRangeToValue(WEEK_OPTIONS[CURRENT_WEEK_INDEX]) : "";

export function ManagerShiftsView() {
  const { user } = useAuth();
  const managerLocations = user?.locations ? user.locations.map((l) => ({ id: l.id, name: l.name })) : [];
  const managerLocationIds = managerLocations.map((l) => l.id);

  const [apiShifts, setApiShifts] = useState<ApiShift[]>([]);
  const [skills, setSkills] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [assignModalShift, setAssignModalShift] = useState<ApiShift | null>(null);
  const [assignSubmitting, setAssignSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [assignableUsers, setAssignableUsers] = useState<{ id: number; name: string }[]>([]);
  const [selectedWeekValue, setSelectedWeekValue] = useState(DEFAULT_WEEK_VALUE);
  const [publishSubmitting, setPublishSubmitting] = useState(false);

  const loadShifts = useCallback(async (weekRange?: WeekRange | null) => {
    setLoading(true);
    setError(null);
    try {
      const list = await getShifts(
        weekRange ? { weekStart: weekRange.start, weekEnd: weekRange.end } : undefined
      );
      setApiShifts(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load shifts");
      setApiShifts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSkills = useCallback(async () => {
    try {
      const skillList = await getSkills();
      setSkills(Array.isArray(skillList) ? skillList : []);
    } catch {
      setSkills([]);
    }
  }, []);

  const loadAssignableUsers = useCallback(async () => {
    try {
      const list = await getUsers();
      const users = Array.isArray(list) ? list : [];
      setAssignableUsers(users.filter((u) => u.role !== "admin").map((u) => ({ id: u.id, name: u.name })));
    } catch {
      setAssignableUsers([]);
    }
  }, []);

  useEffect(() => {
    const range = valueToWeekRange(selectedWeekValue);
    loadShifts(range ?? undefined);
  }, [selectedWeekValue, loadShifts]);

  useEffect(() => {
    loadSkills();
    loadAssignableUsers();
  }, [loadSkills, loadAssignableUsers]);

  const filteredApiShifts =
    managerLocationIds.length > 0
      ? apiShifts.filter((s) => s.locationId != null && managerLocationIds.includes(s.locationId))
      : apiShifts;

  const handleCreateShift = async (values: ShiftFormValues) => {
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      await createShift(values);
      setShiftModalOpen(false);
      await loadShifts(valueToWeekRange(selectedWeekValue) ?? undefined);
    } catch (e) {
      if (isValidationError(e)) {
        setError(e.message);
        setFieldErrors(e.byPath);
      } else {
        setError(e instanceof Error ? e.message : "Failed to create shift");
        setFieldErrors({});
      }
      throw e;
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Shifts</h1>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">
              All shifts (my locations)
            </h2>
            <p className="mt-1 text-sm text-muted">
              Create and manage shifts for your locations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="schedule-week" className="text-sm text-muted">
                Current schedule
              </label>
              <select
                id="schedule-week"
                value={selectedWeekValue}
                onChange={(e) => setSelectedWeekValue(e.target.value)}
                className="rounded border border-border bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                {WEEK_OPTIONS.map((range, index) => (
                  <option key={weekRangeToValue(range)} value={weekRangeToValue(range)}>
                    {formatWeekRangeLabel(range, index === CURRENT_WEEK_INDEX)}
                  </option>
                ))}
              </select>
            </div>
            <Button
              onClick={async () => {
                const draftIds = filteredApiShifts.filter((s) => s.status === "draft").map((s) => s.id);
                if (draftIds.length === 0) {
                  setError("No draft shifts in this schedule to publish.");
                  return;
                }
                setPublishSubmitting(true);
                setError(null);
                try {
                  await publishShifts(draftIds);
                  const range = valueToWeekRange(selectedWeekValue);
                  await loadShifts(range ?? undefined);
                } catch (e) {
                  setError(e instanceof Error ? e.message : "Failed to publish schedule");
                } finally {
                  setPublishSubmitting(false);
                }
              }}
              disabled={publishSubmitting}
              variant="secondary"
              className="inline-flex items-center gap-2"
            >
              {publishSubmitting ? "Publishing…" : "Publish schedule"}
            </Button>
            <Button
              onClick={() => setShiftModalOpen(true)}
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4 shrink-0" />
              Create shift
            </Button>
          </div>
        </div>
        {error && (
          <p className="mb-4 text-sm text-red-500">{error}</p>
        )}
        {loading ? (
          <p className="py-4 text-muted">Loading shifts…</p>
        ) : (
          <ShiftTableApi
            shifts={filteredApiShifts}
            showLocation
            onAssignClick={(shift) => setAssignModalShift(shift)}
            onDeleteClick={async (shift) => {
              if (!confirm("Delete this shift and all assignments? This cannot be undone.")) return;
              setDeletingId(shift.id);
              setError(null);
              try {
                await deleteShift(shift.id);
                if (assignModalShift?.id === shift.id) setAssignModalShift(null);
                const range = valueToWeekRange(selectedWeekValue);
                await loadShifts(range ?? undefined);
              } catch (e) {
                setError(e instanceof Error ? e.message : "Failed to delete shift");
              } finally {
                setDeletingId(null);
              }
            }}
            deletingId={deletingId}
          />
        )}
        {!loading && filteredApiShifts.length === 0 && (
          <p className="py-4 text-sm text-muted">
            No shifts yet. Create one to get started.
          </p>
        )}
      </Card>
      <ShiftModal
        open={shiftModalOpen}
        onClose={() => {
          setShiftModalOpen(false);
          setError(null);
          setFieldErrors({});
        }}
        locations={managerLocations}
        skills={skills}
        onSubmit={handleCreateShift}
        isSubmitting={submitting}
        error={error}
        fieldErrors={fieldErrors}
      />
      {assignModalShift && (
        <AssignUserToShiftModal
          open={!!assignModalShift}
          onClose={() => setAssignModalShift(null)}
          shiftId={assignModalShift.id}
          shiftLabel={`${assignModalShift.location?.name ?? ""} · ${formatShiftDateInTz(assignModalShift.startTime, assignModalShift.location?.timezone ?? DEFAULT_TIMEZONE)}`}
          users={assignableUsers}
          assignedUsers={(assignModalShift.users ?? []).map((u: { id: number; name: string }) => ({ id: u.id, name: u.name }))}
          onAssign={async (userIds) => {
            setAssignSubmitting(true);
            try {
              await assignUsersToShift(assignModalShift.id, userIds);
              const range = valueToWeekRange(selectedWeekValue);
              await loadShifts(range ?? undefined);
              const list = await getShifts(
                range ? { weekStart: range.start, weekEnd: range.end } : undefined
              );
              const updated = (Array.isArray(list) ? list : []).find((s) => s.id === assignModalShift.id);
              if (updated) setAssignModalShift(updated);
            } finally {
              setAssignSubmitting(false);
            }
          }}
          onUnassign={async (userId) => {
            const updated = await unassignUserFromShift(assignModalShift.id, userId);
            setAssignModalShift(updated as ApiShift);
            await loadShifts(valueToWeekRange(selectedWeekValue) ?? undefined);
          }}
          isSubmitting={assignSubmitting}
        />
      )}
    </>
  );
}
