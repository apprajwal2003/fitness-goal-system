export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function minutesToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function parseTimeRange(range: { start: string; end: string }): [number, number] {
  return [timeToMinutes(range.start), timeToMinutes(range.end)];
}

/** Merge overlapping or adjacent ranges; returns sorted by start */
export function mergeRanges(ranges: Array<{ start: string; end: string }>): Array<[number, number]> {
  if (ranges.length === 0) return [];
  const parsed = ranges.map(parseTimeRange).sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  let [curStart, curEnd] = parsed[0];
  for (let i = 1; i < parsed.length; i++) {
    const [s, e] = parsed[i];
    if (s <= curEnd) {
      curEnd = Math.max(curEnd, e);
    } else {
      merged.push([curStart, curEnd]);
      [curStart, curEnd] = [s, e];
    }
  }
  merged.push([curStart, curEnd]);
  return merged;
}

/** Get free intervals in [dayStart, dayEnd] given blocked ranges (in minutes) */
export function getFreeIntervals(
  blocked: Array<[number, number]>,
  dayStartMinutes: number,
  dayEndMinutes: number
): Array<[number, number]> {
  const free: Array<[number, number]> = [];
  let lastEnd = dayStartMinutes;
  for (const [s, e] of blocked) {
    const start = Math.max(s, dayStartMinutes);
    const end = Math.min(e, dayEndMinutes);
    if (start > lastEnd) free.push([lastEnd, start]);
    if (end > lastEnd) lastEnd = end;
  }
  if (lastEnd < dayEndMinutes) free.push([lastEnd, dayEndMinutes]);
  return free;
}
