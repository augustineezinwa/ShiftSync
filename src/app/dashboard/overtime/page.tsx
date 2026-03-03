"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { getUsersByWeeklyHours, type UsersByWeeklyHoursResponse } from "@/lib/api";
import {
  getUpcomingWeekRanges,
  formatWeekRangeLabel,
  weekRangeToValue,
  valueToWeekRange,
  isCurrentWeek,
  type WeekRange,
} from "@/lib/week-ranges";

type OvertimeUser = UsersByWeeklyHoursResponse["users"][number];

function getDefaultWeekValue(): string {
  const opts = getUpcomingWeekRanges();
  const current = opts.find(isCurrentWeek);
  return current ? weekRangeToValue(current) : (opts[2] ? weekRangeToValue(opts[2]) : "");
}

export default function OvertimePage() {
  const weekOptions = getUpcomingWeekRanges();
  const [selectedWeekValue, setSelectedWeekValue] = useState(getDefaultWeekValue);
  const [data, setData] = useState<UsersByWeeklyHoursResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsersByWeeklyHours = useCallback(async (weekRange: WeekRange | null) => {
    if (!weekRange) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getUsersByWeeklyHours({
        weekStart: weekRange.start,
        weekEnd: weekRange.end,
      });
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load overtime data");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const range = valueToWeekRange(selectedWeekValue);
    loadUsersByWeeklyHours(range);
  }, [selectedWeekValue, loadUsersByWeeklyHours]);

  const users: OvertimeUser[] = data?.users ?? [];

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Overtime</h1>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <CardHeader className="border-0 pb-0">Projected weekly hours (my locations)</CardHeader>
          <div className="flex items-center gap-2">
            <label htmlFor="overtime-week" className="text-sm text-muted">
              Current schedule
            </label>
            <select
              id="overtime-week"
              value={selectedWeekValue}
              onChange={(e) => setSelectedWeekValue(e.target.value)}
              className="rounded border border-border bg-surface px-3 py-2 text-sm text-white focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            >
              {weekOptions.map((range) => (
                <option key={weekRangeToValue(range)} value={weekRangeToValue(range)}>
                  {formatWeekRangeLabel(range, isCurrentWeek(range))}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error && (
          <p className="p-4 text-center text-danger">{error}</p>
        )}
        {!error && (
          <Table>
            <TableHead>
              <TableRow>
                <Th>Staff Name</Th>
                <Th>Projected Hours</Th>
                <Th>Status</Th>
                <Th>Notes / Warnings</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <Td colSpan={4} className="p-4 text-center text-muted">
                    Loading…
                  </Td>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <Td className="font-medium text-gray-100">{u.name}</Td>
                    <Td>{Number(u.weeklyHours).toFixed(1)}h</Td>
                    <Td>{u.status}</Td>
                    <Td className="text-muted">{u.notes || "—"}</Td>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
        {!error && !loading && users.length === 0 && (
          <p className="p-4 text-center text-muted">No staff with projected hours in this period.</p>
        )}
      </Card>
    </>
  );
}
