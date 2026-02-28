"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { DAYS_OF_WEEK, type DayOfWeek, type WeeklyAvailability } from "@/lib/mock-data";

const DEFAULT_SLOT = { start: "09:00", end: "17:00" };

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

  const setDay = (day: DayOfWeek, value: { start: string; end: string } | null) => {
    setAvailability((prev) => ({ ...prev, [day]: value }));
  };

  const handleSave = () => {
    // MVP: would persist to API
    alert("Availability saved!");
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
      <Button onClick={handleSave} className="mt-4">
        Save availability
      </Button>
    </Card>
  );
}
