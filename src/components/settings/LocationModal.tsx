"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { getOffsetHoursForTimezone } from "@/lib/time";



const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export type LocationFormValues = {
  name: string;
  timezone: string;
  offset: number;
  isVerified: boolean;
};

const defaultValues: LocationFormValues = {
  name: "",
  timezone: "UTC",
  offset: 0,
  isVerified: false,
};

interface LocationModalProps {
  open: boolean;
  onClose: () => void;
  initialValues?: LocationFormValues | null;
  onSubmit: (values: LocationFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

export function LocationModal({
  open,
  onClose,
  initialValues,
  onSubmit,
  isSubmitting = false,
}: LocationModalProps) {
  const isEdit = initialValues != null;
  const [name, setName] = useState(defaultValues.name);
  const [timezone, setTimezone] = useState(defaultValues.timezone);
  const [offset, setOffset] = useState(defaultValues.offset);
  const [isVerified, setIsVerified] = useState(defaultValues.isVerified);

  useEffect(() => {
    if (open) {
      if (initialValues) {
        setName(initialValues.name);
        setTimezone(initialValues.timezone);
        setOffset(initialValues.offset);
        setIsVerified(initialValues.isVerified);
      } else {
        setName(defaultValues.name);
        setTimezone(defaultValues.timezone);
        setOffset(defaultValues.offset);
        setIsVerified(defaultValues.isVerified);
      }
    }
  }, [open, initialValues]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    await onSubmit({ name: trimmed, timezone, offset, isVerified });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit location" : "Add location"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="location-name" className="mb-1 block text-xs text-muted">
            Name
          </label>
          <input
            id="location-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Downtown"
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-white placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            required
          />
        </div>
        <div>
          <label htmlFor="location-timezone" className="mb-1 block text-xs text-muted">
            Timezone
          </label>
          <select
            id="location-timezone"
            value={timezone}
            onChange={(e) => {
              const tz = e.target.value;
              setTimezone(tz);
              setOffset(getOffsetHoursForTimezone(tz));
            }}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="location-offset" className="mb-1 block text-xs text-muted">
            Offset (hours)
          </label>
          <input
            id="location-offset"
            type="number"
            min={-12}
            max={14}
            step={0.5}
            value={offset}
            onChange={(e) => setOffset(Number(e.target.value))}
            className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
            />
            Verified
          </label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
