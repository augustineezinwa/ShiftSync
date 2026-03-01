"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import {
  getShiftsForStaff,
  getLocation,
  getSkill,
  getStaff,
  SHIFTS,
  type Shift as MockShift,
} from "@/lib/mock-data";
import { useAuth } from "@/providers/AuthProvider";
import { getShifts, getSkills, createShift, type ApiShift, isValidationError } from "@/lib/api";
import { ShiftModal, type ShiftFormValues } from "@/components/shifts/ShiftModal";
import { formatShiftDateInTz, formatShiftTimeInTz, isPremiumShift } from "@/lib/shift-utils";
import { Plus } from "lucide-react";

const DEFAULT_TIMEZONE = "UTC";

function ShiftTableMock({
  shifts,
  showLocation = true,
}: {
  shifts: MockShift[];
  showLocation?: boolean;
}) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          {showLocation && <Th>Location</Th>}
          <Th>Date</Th>
          <Th>Time</Th>
          <Th>Skill</Th>
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

function ShiftTableApi({
  shifts,
  showLocation = true,
}: {
  shifts: ApiShift[];
  showLocation?: boolean;
}) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          {showLocation && <Th>Location</Th>}
          <Th>Date</Th>
          <Th>Time</Th>
          <Th>Skill</Th>
          <Th>Assigned</Th>
          <Th>Status</Th>
        </TableRow>
      </TableHead>
      <TableBody>
        {shifts.map((s) => {
          const tz = s.location?.timezone ?? DEFAULT_TIMEZONE;
          const premium = isPremiumShift(s.startTime, tz);
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
              <Td>
                {(s.users ?? []).length > 0
                  ? (s.users ?? []).map((u) => u.name).join(", ")
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
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default function ShiftsPage() {
  const { user, isLoading } = useAuth();
  const role = user?.role ?? "staff";
  const userId = user?.id != null ? String(user.id) : "";
  const isStaff = role === "staff";
  const isManager = role === "manager";

  const [apiShifts, setApiShifts] = useState<ApiShift[]>([]);
  const [skills, setSkills] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  /** Manager locations from logged-in user (not GET /locations, which is admin-only) */
  const managerLocations = isManager && user?.locations ? user.locations.map((l) => ({ id: l.id, name: l.name })) : [];
  const managerLocationIds = managerLocations.map((l) => l.id);

  const loadShifts = useCallback(async () => {
    if (!isManager) return;
    setLoading(true);
    setError(null);
    try {
      const list = await getShifts();
      setApiShifts(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load shifts");
      setApiShifts([]);
    } finally {
      setLoading(false);
    }
  }, [isManager]);

  const loadSkills = useCallback(async () => {
    if (!isManager) return;
    try {
      const skillList = await getSkills();
      setSkills(Array.isArray(skillList) ? skillList : []);
    } catch {
      setSkills([]);
    }
  }, [isManager]);

  useEffect(() => {
    if (isManager) {
      loadShifts();
      loadSkills();
    }
  }, [isManager, loadShifts, loadSkills]);

  const filteredApiShifts =
    isManager && managerLocationIds.length > 0
      ? apiShifts.filter((s) => s.locationId != null && managerLocationIds.includes(s.locationId))
      : apiShifts;

  const handleCreateShift = async (values: ShiftFormValues) => {
    setSubmitting(true);
    setError(null);
    setFieldErrors({});
    try {
      await createShift(values);
      setShiftModalOpen(false);
      await loadShifts();
    } catch (e) {
      if (isValidationError(e)) {
        setError(e.message);
        setFieldErrors(e.byPath);
      } else {
        setError(e instanceof Error ? e.message : "Failed to create shift");
        setFieldErrors({});
      }
      throw e; // rethrow so modal does not call onClose() and stays open to show error
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <p className="text-muted">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <p className="text-muted">Sign in to view shifts.</p>
    );
  }

  if (isStaff) {
    const mockShifts = userId ? getShiftsForStaff(userId) : [];
    return (
      <>
        <h1 className="mb-6 text-2xl font-semibold text-white">Shifts</h1>
        <Card>
          <CardHeader>My shifts</CardHeader>
          <ShiftTableMock shifts={mockShifts} showLocation />
        </Card>
      </>
    );
  }

  if (isManager) {
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
            <Button
              onClick={() => setShiftModalOpen(true)}
              className="inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4 shrink-0" />
              Create shift
            </Button>
          </div>
          {error && (
            <p className="mb-4 text-sm text-red-500">{error}</p>
          )}
          {loading ? (
            <p className="py-4 text-muted">Loading shifts…</p>
          ) : (
            <ShiftTableApi shifts={filteredApiShifts} showLocation />
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
      </>
    );
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Shifts</h1>
      <Card>
        <CardHeader>All shifts</CardHeader>
        <ShiftTableMock shifts={SHIFTS} showLocation />
      </Card>
    </>
  );
}
