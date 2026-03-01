"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { getMyShifts, type ApiShift } from "@/lib/api";
import { ShiftTableApi } from "@/components/shifts/ShiftTableApi";
import {
  getUpcomingWeekRanges,
  formatWeekRangeLabel,
  weekRangeToValue,
  valueToWeekRange,
  CURRENT_WEEK_INDEX,
  type WeekRange,
} from "@/lib/week-ranges";

const WEEK_OPTIONS = getUpcomingWeekRanges();
const DEFAULT_WEEK_VALUE = WEEK_OPTIONS[CURRENT_WEEK_INDEX] ? weekRangeToValue(WEEK_OPTIONS[CURRENT_WEEK_INDEX]) : "";

export function StaffShiftsView() {
  const [myShifts, setMyShifts] = useState<ApiShift[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedWeekValue, setSelectedWeekValue] = useState(DEFAULT_WEEK_VALUE);

  const loadMyShifts = useCallback(async (weekRange: WeekRange | null) => {
    setLoading(true);
    setError(null);
    try {
      const list = await getMyShifts(
        weekRange ? { weekStart: weekRange.start, weekEnd: weekRange.end } : undefined
      );
      setMyShifts(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load shifts");
      setMyShifts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const range = valueToWeekRange(selectedWeekValue);
    loadMyShifts(range);
  }, [selectedWeekValue, loadMyShifts]);

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Shifts</h1>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">My shifts</h2>
            <p className="mt-1 text-sm text-muted">Shifts you are assigned to.</p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="staff-schedule-week" className="text-sm text-muted">
              Current schedule
            </label>
            <select
              id="staff-schedule-week"
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
        </div>
        {error && (
          <p className="mb-4 text-sm text-red-500">{error}</p>
        )}
        {loading ? (
          <p className="py-4 text-muted">Loading shifts…</p>
        ) : (
          <ShiftTableApi
            shifts={myShifts}
            showLocation
            disableActions
          />
        )}
        {!loading && myShifts.length === 0 && (
          <p className="py-4 text-sm text-muted">No shifts assigned for this week.</p>
        )}
      </Card>
    </>
  );
}
