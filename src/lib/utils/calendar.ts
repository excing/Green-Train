import type { Train, TrainCalendarRange, TrainCalendarRule } from '$lib/types/trains';
import { defaultTZ } from './datetime';

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map((v) => parseInt(v, 10));
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

function fmtDateUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = (d.getUTCMonth() + 1).toString().padStart(2, '0');
  const dd = d.getUTCDate().toString().padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

function weekdayNum(date: Date, tz: string): number {
  // 1..7 Monday..Sunday, using target tz local week day
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: tz, weekday: 'short' });
  const wd = fmt.format(date); // e.g., Mon/Tue
  const map: Record<string, number> = { Sun: 7, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[wd as keyof typeof map] ?? 1;
}

function datesFromRange(r: TrainCalendarRange): string[] {
  const res: string[] = [];
  let cur = parseDate(r.start);
  const end = parseDate(r.end);
  const weekdays = r.weekdays?.slice().sort();
  while (cur.getTime() <= end.getTime()) {
    if (!weekdays || weekdays.includes(weekdayNum(cur, 'UTC'))) {
      res.push(fmtDateUTC(cur));
    }
    cur = addDays(cur, 1);
  }
  return res;
}

function datesFromRule(rule: TrainCalendarRule): string[] {
  const res: string[] = [];
  let cur = parseDate(rule.start);
  const end = parseDate(rule.end);
  if (rule.freq === 'DAILY') {
    while (cur.getTime() <= end.getTime()) {
      res.push(fmtDateUTC(cur));
      cur = addDays(cur, 1);
    }
  } else if (rule.freq === 'WEEKLY') {
    const weekdays = (rule.weekdays || []).slice().sort();
    while (cur.getTime() <= end.getTime()) {
      const wd = weekdayNum(cur, 'UTC');
      if (weekdays.includes(wd)) res.push(fmtDateUTC(cur));
      cur = addDays(cur, 1);
    }
  }
  return res;
}

export function mergeServiceDays(train: Train, from: string, to: string): string[] {
  const tz = defaultTZ(train);
  const start = parseDate(from);
  const end = parseDate(to);
  const base: Set<string> = new Set();

  // 1) 基础周模式
  if (train.service_days && train.service_days.length > 0) {
    let cur = new Date(start);
    while (cur.getTime() <= end.getTime()) {
      const wd = weekdayNum(cur, tz);
      if (train.service_days.includes(wd)) {
        base.add(fmtDateUTC(cur));
      }
      cur = addDays(cur, 1);
    }
  }

  // 2) include_ranges
  for (const r of train.calendar?.include_ranges || []) {
    for (const d of datesFromRange(r)) base.add(d);
  }

  // 3) rules
  for (const r of train.calendar?.rules || []) {
    for (const d of datesFromRule(r)) base.add(d);
  }

  // 4) includes
  for (const d of train.calendar?.includes || []) base.add(d);

  // 5) exclude_ranges
  for (const r of train.calendar?.exclude_ranges || []) {
    for (const d of datesFromRange(r)) base.delete(d);
  }

  // 6) excludes
  for (const d of train.calendar?.excludes || []) base.delete(d);

  // 状态过滤
  if (train.status === 'draft' || train.status === 'archived') {
    return [];
  }

  return Array.from(base).sort();
}

export function tzToday(tz: string): string {
  const now = new Date();
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now).map(p => [p.type, p.value]));
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function clampServiceWindow(train: Train, days: number): { from: string; to: string } {
  const tz = defaultTZ(train);
  const from = tzToday(tz);
  const start = parseDate(from);
  const to = fmtDateUTC(addDays(start, days));
  return { from, to };
}
