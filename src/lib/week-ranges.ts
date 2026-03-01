import {
  addWeeks,
  endOfWeek,
  format,
  getISOWeek,
  startOfWeek,
} from "date-fns";

/** ISO week (Monday = start). One option = { start, end } as YYYY-MM-DD. */
export type WeekRange = { start: string; end: string };

/** Label for dropdown e.g. "Week 24 10/06/2024 - 16/06/2024". Set isCurrent true to append " (current)". */
export function formatWeekRangeLabel(range: WeekRange, isCurrent?: boolean): string {
  const weekNum = getISOWeek(new Date(range.start));
  const startFmt = format(new Date(range.start), "dd/MM/yyyy");
  const endFmt = format(new Date(range.end), "dd/MM/yyyy");
  const base = `Week ${weekNum} ${startFmt} - ${endFmt}`;
  return isCurrent ? `${base} (current)` : base;
}

const NUM_PAST_WEEKS = 2;

/** Two weeks before current, current week (Monday–Sunday), and next numFuture weeks. */
export function getUpcomingWeekRanges(numFutureWeeks = 11): WeekRange[] {
  const now = new Date();
  const currentStart = startOfWeek(now, { weekStartsOn: 1 });
  const ranges: WeekRange[] = [];
  for (let i = -NUM_PAST_WEEKS; i <= numFutureWeeks; i++) {
    const weekStart = addWeeks(currentStart, i);
    const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
    ranges.push({
      start: format(weekStart, "yyyy-MM-dd"),
      end: format(weekEnd, "yyyy-MM-dd"),
    });
  }
  return ranges;
}

/** Index of the current week in the array returned by getUpcomingWeekRanges(). */
export const CURRENT_WEEK_INDEX = NUM_PAST_WEEKS;

/** Value string for select: "start|end" */
export function weekRangeToValue(range: WeekRange): string {
  return `${range.start}|${range.end}`;
}

export function valueToWeekRange(value: string): WeekRange | null {
  const [start, end] = value.split("|");
  if (!start || !end || start.length !== 10 || end.length !== 10) return null;
  return { start, end };
}
