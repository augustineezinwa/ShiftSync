"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import { ShiftTableMock } from "@/components/shifts/ShiftTableMock";
import { SHIFTS } from "@/lib/mock-data";

export function AllShiftsView() {
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
