import type { Train } from './types';
import { todayInZone } from './time';

function parseYMD(ymd: string) {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error(`Invalid date: ${ymd}`);
  return { y: parseInt(m[1], 10), m: parseInt(m[2], 10), d: parseInt(m[3], 10) };
}

function cmpYMD(a: string, b: string): number {
  return a === b ? 0 : a < b ? -1 : 1;
}

function dayOfWeek(ymd: string, timeZone: string): number {
  // 1-7 (Mon-Sun)
  // Use 12:00 local to avoid DST
  const { y, m, d } = parseYMD(ymd);
  const base = new Date(Date.UTC(y, m - 1, d, 12, 0));
  const fmt = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' });
  const wk = fmt.format(base); // Mon, Tue...
  const map: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
  return map[wk] ?? 1;
}

export function isServiceDay(train: Train, ymd: string): boolean {
  const tz = train.timezone;
  const cal = train.calendar || {};
  const dow = dayOfWeek(ymd, tz);

  let included = false;

  if (train.service_days && train.service_days.length > 0) {
    if (train.service_days.includes(dow)) included = true;
  } else {
    // If not specified, default include
    included = true;
  }

  if (cal.rules && cal.rules.length) {
    for (const r of cal.rules) {
      if (r.freq === 'DAILY' && cmpYMD(ymd, r.start) >= 0 && cmpYMD(ymd, r.end) <= 0) {
        included = true;
        break;
      }
    }
  }

  if (cal.include_ranges && cal.include_ranges.length) {
    for (const rng of cal.include_ranges) {
      if (cmpYMD(ymd, rng.start) >= 0 && cmpYMD(ymd, rng.end) <= 0) {
        if (!rng.weekdays || rng.weekdays.includes(dow)) included = true;
      }
    }
  }

  if (cal.includes && cal.includes.includes(ymd)) included = true;

  if (cal.excludes && cal.excludes.includes(ymd)) return false; // 排除优先

  return included;
}

export function getServiceDates(train: Train, futureDays = 30, start: Date = new Date()): string[] {
  const tz = train.timezone;
  const startYmd = todayInZone(tz, start);
  const out: string[] = [];
  for (let i = 0; i < futureDays; i++) {
    // Add i days
    const base = new Date(start);
    const ymd = (() => {
      // Compose via time.ts todayInZone by adding milliseconds
      const dt = new Date(base.getTime() + i * 86400000);
      return todayInZone(tz, dt);
    })();
    if (isServiceDay(train, ymd)) out.push(ymd);
  }
  return out;
}
