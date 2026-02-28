"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { getLocation, getSkill } from "@/lib/mock-data";
import type { Shift } from "@/lib/mock-data";

interface CurrentShiftCardProps {
  shift: Shift | null;
}

export function CurrentShiftCard({ shift }: CurrentShiftCardProps) {
  const handleCheckIn = () => {
    // MVP: placeholder — would call API to record clock-in
    alert("Checked in!");
  };

  return (
    <Card>
      <CardHeader>Current shift</CardHeader>
      {shift ? (
        <>
          <div className="space-y-2">
            <p className="font-medium text-white">
              {getLocation(shift.locationId)?.name ?? shift.locationId}
            </p>
            <p className="text-sm text-gray-300">
              {shift.date} · {shift.startTime} – {shift.endTime}
            </p>
            <p className="text-sm text-muted">
              {getSkill(shift.skillId)?.name ?? shift.skillId}
              {shift.isPremium && (
                <span className="ml-2 text-warning">Premium</span>
              )}
            </p>
          </div>
          <Button onClick={handleCheckIn} className="mt-4">
            Check in
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted">No shift in progress.</p>
      )}
    </Card>
  );
}
