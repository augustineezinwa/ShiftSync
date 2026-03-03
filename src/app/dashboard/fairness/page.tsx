"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, Th, Td } from "@/components/ui/Table";
import { getFairnessAnalytics, type FairnessAnalyticsResponse } from "@/lib/api";
import {
  getUpcomingWeekRanges,
  formatWeekRangeLabel,
  weekRangeToValue,
  valueToWeekRange,
  isCurrentWeek,
  type WeekRange,
} from "@/lib/week-ranges";

type FairnessRow = FairnessAnalyticsResponse["analytics"][number];

const STATUS_LABELS: Record<string, string> = {
  Under: "Under-scheduled",
  Balanced: "Normal",
  Over: "Overscheduled",
};

const STATUS_VARIANTS: Record<string, "warning" | "success" | "danger"> = {
  Under: "warning",
  Balanced: "success",
  Over: "danger",
};

function getDefaultWeekValue(): string {
  const opts = getUpcomingWeekRanges();
  const current = opts.find(isCurrentWeek);
  return current ? weekRangeToValue(current) : (opts[2] ? weekRangeToValue(opts[2]) : "");
}

export default function FairnessPage() {
  const weekOptions = getUpcomingWeekRanges();
  const [selectedWeekValue, setSelectedWeekValue] = useState(getDefaultWeekValue);
  const [data, setData] = useState<FairnessAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFairnessAnalytics = useCallback(async (weekRange: WeekRange | null) => {
    if (!weekRange) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getFairnessAnalytics({
        weekStart: weekRange.start,
        weekEnd: weekRange.end,
      });
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load fairness analytics");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const range = valueToWeekRange(selectedWeekValue);
    loadFairnessAnalytics(range);
  }, [selectedWeekValue, loadFairnessAnalytics]);

  const rows: FairnessRow[] = data?.analytics ?? [];

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold text-white">Fairness</h1>
      <Card className="mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <CardHeader className="border-0 pb-0">
              Premium shift distribution (Fri/Sat evening)
            </CardHeader>
            <p className="mt-1 text-sm text-muted">
              Team median = median of assigned hours. Fairness diff = assigned hrs − team median.
              Overload diff = assigned hrs − desired hrs. Status is from overload diff
              (under-scheduled / normal / overscheduled).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="fairness-week" className="text-sm text-muted">
              Current schedule
            </label>
            <select
              id="fairness-week"
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
        {error && <p className="p-4 text-center text-danger">{error}</p>}
        {!error && (
          <Table>
            <TableHead>
              <TableRow>
                <Th className="min-w-[7rem]">Location</Th>
                <Th className="min-w-[8rem]">Staff</Th>
                <Th className="min-w-[6rem]">Assigned hrs</Th>
                <Th className="min-w-[6rem]">Desired hrs</Th>
                <Th className="min-w-[6rem]">Premium shifts</Th>
                <Th className="min-w-[6rem]">Team median</Th>
                <Th className="min-w-[6rem]">Fairness diff</Th>
                <Th className="min-w-[6rem]">Overload diff</Th>
                <Th className="min-w-[8rem]">Status</Th>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <Td colSpan={9} className="p-4 text-center text-muted">
                    Loading…
                  </Td>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={`${r.id}-${r.location ?? "noloc"}`}>
                    <Td className="min-w-[7rem]">{r.location ?? "—"}</Td>
                    <Td className="min-w-[8rem] font-medium text-gray-100">{r.name}</Td>
                    <Td className="min-w-[6rem]">{Number(r.assignedHours).toFixed(1)}h</Td>
                    <Td className="min-w-[6rem]">{Number(r.desiredHours).toFixed(1)}h</Td>
                    <Td className="min-w-[6rem]">{r.premiumShifts}</Td>
                    <Td className="min-w-[6rem]">{Number(r.teamMedian).toFixed(1)}</Td>
                    <Td className="min-w-[6rem]">{r.fairnessDiff >= 0 ? `+${r.fairnessDiff}` : r.fairnessDiff}</Td>
                    <Td className="min-w-[6rem]">{r.overloadDiff >= 0 ? `+${r.overloadDiff}` : r.overloadDiff}</Td>
                    <Td className="min-w-[8rem] whitespace-nowrap">
                      <Badge variant={STATUS_VARIANTS[r.status] ?? "success"} className="whitespace-nowrap">
                        {STATUS_LABELS[r.status] ?? r.status}
                      </Badge>
                    </Td>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
        {!error && !loading && rows.length === 0 && (
          <p className="p-4 text-center text-muted">No staff in selected locations.</p>
        )}
      </Card>
    </>
  );
}
