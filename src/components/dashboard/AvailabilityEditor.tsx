"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { updateMeAvailability } from "@/lib/api";
import { DAYS_OF_WEEK, type DayOfWeek, type WeeklyAvailability } from "@/lib/mock-data";

const DEFAULT_SLOT = { start: "09:00", end: "17:00" };

/** Monday = 0, Tuesday = 1, … Sunday = 6 */
const DAY_OF_WEEK_INDEX: Record<DayOfWeek, number> = {
  monday: 0,
  tuesday: 1,
  wednesday: 2,
  thursday: 3,
  friday: 4,
  saturday: 5,
  sunday: 6,
};

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

interface AvailabilityEditorProps {
  initial: WeeklyAvailability;
}

export function AvailabilityEditor({ initial }: AvailabilityEditorProps) {
  const [availability, setAvailability] = useState<WeeklyAvailability>(() => {
    const acc: WeeklyAvailability = {};
    for (const day of DAYS_OF_WEEK) {
      acc[day] = initial[day] ?? null;
    }
    return acc;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setDay = (day: DayOfWeek, value: { start: string; end: string } | null) => {
    setAvailability((prev) => ({ ...prev, [day]: value }));
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payloads = DAYS_OF_WEEK.map((day) => {
        const value = availability[day];
        const isActive = value !== undefined && value !== null;
        const dayOfWeek = DAY_OF_WEEK_INDEX[day];
        return updateMeAvailability({
          dayOfWeek,
          isActive,
          startTime: isActive ? value!.start : "00:00",
          endTime: isActive ? value!.end : "00:00",
        });
      });
      await Promise.all(payloads);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save availability");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>Weekly availability</CardHeader>
      <p className="mb-4 text-sm text-muted">
        Set when you’re available to work (recurring weekly). Leave unchecked or set to “Not available” for days off.
      </p>
      <div className="space-y-3">
        {DAYS_OF_WEEK.map((day) => {
          const value = availability[day];
          const isAvailable = value !== undefined && value !== null;
          return (
            <div
              key={day}
              className="flex flex-wrap items-center gap-3 rounded border border-border bg-surface/50 p-3"
            >
              <label className="flex min-w-[7rem] items-center gap-2">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) =>
                    setDay(day, e.target.checked ? { ...DEFAULT_SLOT } : null)
                  }
                  className="h-4 w-4 rounded border-border text-accent focus:ring-accent"
                />
                <span className="text-sm font-medium text-gray-200">
                  {capitalize(day)}
                </span>
              </label>
              {isAvailable ? (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={value.start}
                      onChange={(e) =>
                        setDay(day, { ...value, start: e.target.value })
                      }
                      className="rounded border border-border bg-surface px-2 py-1.5 text-sm text-gray-200 [color-scheme:dark]"
                    />
                    <span className="text-muted">–</span>
                    <input
                      type="time"
                      value={value.end}
                      onChange={(e) =>
                        setDay(day, { ...value, end: e.target.value })
                      }
                      className="rounded border border-border bg-surface px-2 py-1.5 text-sm text-gray-200 [color-scheme:dark]"
                    />
                  </div>
                </>
              ) : (
                <span className="text-sm text-muted">Not available</span>
              )}
            </div>
          );
        })}
      </div>
      {error && (
        <p className="mt-3 text-sm text-red-500">{error}</p>
      )}
      <Button onClick={handleSave} className="mt-4" disabled={saving}>
        {saving ? "Saving…" : "Save availability"}
      </Button>
    </Card>
  );
}
