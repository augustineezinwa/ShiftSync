"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export type ShiftFormValues = {
  locationId: number;
  skillId: number;
  startTime: string;
  endTime: string;
  headcount: number;
};

const defaultValues: ShiftFormValues = {
  locationId: 0,
  skillId: 0,
  startTime: "",
  endTime: "",
  headcount: 1,
};

type Option = { id: number; name: string };

interface ShiftModalProps {
  open: boolean;
  onClose: () => void;
  locations: Option[];
  skills: Option[];
  initialValues?: ShiftFormValues | null;
  onSubmit: (values: ShiftFormValues) => Promise<void>;
  isSubmitting?: boolean;
  /** Validation or server error to show on the form */
  error?: string | null;
  /** Per-field validation errors (e.g. from 422 API response) */
  fieldErrors?: Record<string, string> | null;
}

/** Format Date for datetime-local input (YYYY-MM-DDTHH:mm) */
function toDatetimeLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function ShiftModal({
  open,
  onClose,
  locations,
  skills,
  initialValues,
  onSubmit,
  isSubmitting = false,
  error: formError = null,
  fieldErrors = null,
}: ShiftModalProps) {
  const getFieldError = (path: string) => (fieldErrors && fieldErrors[path]) || null;
  const isEdit = initialValues != null;
  const [locationId, setLocationId] = useState(defaultValues.locationId);
  const [skillId, setSkillId] = useState(defaultValues.skillId);
  const [startTime, setStartTime] = useState(defaultValues.startTime);
  const [endTime, setEndTime] = useState(defaultValues.endTime);
  const [headcount, setHeadcount] = useState(defaultValues.headcount);

  useEffect(() => {
    if (open) {
      if (initialValues) {
        setLocationId(initialValues.locationId);
        setSkillId(initialValues.skillId);
        setStartTime(initialValues.startTime);
        setEndTime(initialValues.endTime);
        setHeadcount(initialValues.headcount);
      } else {
        setLocationId(defaultValues.locationId);
        setSkillId(defaultValues.skillId);
        setStartTime(defaultValues.startTime);
        setEndTime(defaultValues.endTime);
        setHeadcount(defaultValues.headcount);
      }
    }
  }, [open, initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId || !skillId || !startTime || !endTime) return;
    // Send raw datetime-local values (YYYY-MM-DDTHH:mm) so backend interprets them in the shift location's timezone
    try {
      await onSubmit({
        locationId,
        skillId,
        startTime,
        endTime,
        headcount: Math.max(1, headcount),
      });
      onClose();
    } catch {
      // Leave modal open so parent can show error via the error prop
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Edit shift" : "Create shift"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <p className="whitespace-pre-line rounded border border-red-500/50 bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
            {formError}
          </p>
        )}
        <div>
          <label htmlFor="shift-location" className="mb-1 block text-xs text-muted">
            Location
          </label>
          <select
            id="shift-location"
            value={locationId || ""}
            onChange={(e) => setLocationId(Number(e.target.value))}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            required
            aria-invalid={!!getFieldError("locationId")}
            aria-describedby={getFieldError("locationId") ? "shift-location-error" : undefined}
          >
            <option value="">Select location</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
          {getFieldError("locationId") && (
            <p id="shift-location-error" className="mt-1 text-sm text-red-400">
              {getFieldError("locationId")}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="shift-skill" className="mb-1 block text-xs text-muted">
            Skill
          </label>
          <select
            id="shift-skill"
            value={skillId || ""}
            onChange={(e) => setSkillId(Number(e.target.value))}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            required
            aria-invalid={!!getFieldError("skillId")}
            aria-describedby={getFieldError("skillId") ? "shift-skill-error" : undefined}
          >
            <option value="">Select skill</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {getFieldError("skillId") && (
            <p id="shift-skill-error" className="mt-1 text-sm text-red-400">
              {getFieldError("skillId")}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="shift-start" className="mb-1 block text-xs text-muted">
            Start
          </label>
          <input
            id="shift-start"
            type="datetime-local"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent [color-scheme:dark]"
            required
            aria-invalid={!!getFieldError("startTime")}
            aria-describedby={getFieldError("startTime") ? "shift-start-error" : undefined}
          />
          {getFieldError("startTime") && (
            <p id="shift-start-error" className="mt-1 text-sm text-red-400">
              {getFieldError("startTime")}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="shift-end" className="mb-1 block text-xs text-muted">
            End
          </label>
          <input
            id="shift-end"
            type="datetime-local"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent [color-scheme:dark]"
            required
            aria-invalid={!!getFieldError("endTime")}
            aria-describedby={getFieldError("endTime") ? "shift-end-error" : undefined}
          />
          {getFieldError("endTime") && (
            <p id="shift-end-error" className="mt-1 text-sm text-red-400">
              {getFieldError("endTime")}
            </p>
          )}
          <p className="mt-1 text-xs text-muted">Times are in the selected location&apos;s timezone.</p>
        </div>
        <div>
          <label htmlFor="shift-headcount" className="mb-1 block text-xs text-muted">
            Headcount
          </label>
          <input
            id="shift-headcount"
            type="number"
            min={1}
            value={headcount}
            onChange={(e) => setHeadcount(Number(e.target.value) || 1)}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            aria-invalid={!!getFieldError("headcount")}
            aria-describedby={getFieldError("headcount") ? "shift-headcount-error" : undefined}
          />
          {getFieldError("headcount") && (
            <p id="shift-headcount-error" className="mt-1 text-sm text-red-400">
              {getFieldError("headcount")}
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !locationId || !skillId || !startTime || !endTime}>
            {isSubmitting ? "Saving…" : isEdit ? "Save" : "Create"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
