import type { Station, StationTiming, Train } from './types';

export function parseRelativeTime(input: string): { hour: number; minute: number; dayOffset: number } {
  const m = input.match(/^(\d{2}):(\d{2})(?:\+(\d{2}))?$/);
  if (!m) throw new Error(`Invalid relative time: ${input}`);
  const hour = parseInt(m[1], 10);
  const minute = parseInt(m[2], 10);
  const dayOffset = m[3] ? parseInt(m[3], 10) : 0;
  return { hour, minute, dayOffset };
}

function pad2(n: number): string { return n.toString().padStart(2, '0'); }

export function formatLocal(d: Date): string {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const hh = pad2(d.getHours());
  const mm = pad2(d.getMinutes());
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

export function formatInTimeZone(d: Date, timeZone: string): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
  // en-CA yields YYYY-MM-DD, HH:MM
  const parts = fmt.formatToParts(d);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  const out = `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}`;
  return out;
}

export function formatTrainTz(d: Date, train: Train): string {
  return formatInTimeZone(d, train.timezone);
}

function parseYMD(ymd: string): { y: number; m: number; d: number } {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) throw new Error(`Invalid date: ${ymd}`);
  return { y: parseInt(m[1], 10), m: parseInt(m[2], 10), d: parseInt(m[3], 10) };
}

function ymdAddDays(ymd: string, add: number, timeZone?: string): string {
  const { y, m, d } = parseYMD(ymd);
  const base = timeZone
    ? zonedDateUTC(y, m, d, 12, 0, timeZone) // noon to avoid DST triggers
    : new Date(Date.UTC(y, m - 1, d, 12, 0));
  const next = new Date(base.getTime() + add * 86400000);
  const yy = timeZone ? getPartsInZone(next, timeZone).year : next.getUTCFullYear();
  const mm = timeZone ? getPartsInZone(next, timeZone).month : next.getUTCMonth() + 1;
  const dd = timeZone ? getPartsInZone(next, timeZone).day : next.getUTCDate();
  return `${yy}-${pad2(mm)}-${pad2(dd)}`;
}

function getPartsInZone(d: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  const parts = fmt.formatToParts(d);
  const pick = (type: Intl.DateTimeFormatPartTypes) => parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);
  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: pick('hour'),
    minute: pick('minute'),
    second: pick('second')
  };
}

function tzOffsetMinutes(at: Date, timeZone: string): number {
  // offset = (local parts interpreted as UTC) - epoch
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });
  const parts = fmt.formatToParts(at);
  const y = parseInt(parts.find((p) => p.type === 'year')?.value ?? '0', 10);
  const m = parseInt(parts.find((p) => p.type === 'month')?.value ?? '0', 10);
  const d = parseInt(parts.find((p) => p.type === 'day')?.value ?? '0', 10);
  const hh = parseInt(parts.find((p) => p.type === 'hour')?.value ?? '0', 10);
  const mm = parseInt(parts.find((p) => p.type === 'minute')?.value ?? '0', 10);
  const ss = parseInt(parts.find((p) => p.type === 'second')?.value ?? '0', 10);
  const asUTC = Date.UTC(y, m - 1, d, hh, mm, ss);
  return Math.round((asUTC - at.getTime()) / 60000);
}

export function zonedDateUTC(year: number, month: number, day: number, hour: number, minute: number, timeZone: string): Date {
  // Two-pass approximation to get the correct instant for a local time in a time zone
  const approx = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const offset1 = tzOffsetMinutes(approx, timeZone);
  const epoch = Date.UTC(year, month - 1, day, hour, minute) - offset1 * 60000;
  const approx2 = new Date(epoch);
  const offset2 = tzOffsetMinutes(approx2, timeZone);
  const finalEpoch = Date.UTC(year, month - 1, day, hour, minute) - offset2 * 60000;
  return new Date(finalEpoch);
}

// 重载：
// 1) toZonedDateTime(serviceDate, rel, tz) → 绝对时间（Date）
// 2) toZonedDateTime(date, tz) → 该绝对时间在 tz 下的各字段（便于格式化）
export function toZonedDateTime(serviceDate: string, rel: string, timeZone: string): Date;
export function toZonedDateTime(d: Date, timeZone: string): { year: number; month: number; day: number; hour: number; minute: number; date: Date };
export function toZonedDateTime(a: string | Date, b: string, c?: string) {
  if (typeof a === 'string' && typeof b === 'string' && typeof c === 'string') {
    // 计算 serviceDate + rel(HH:mm+dd) 在 timeZone 下的绝对时间
    const serviceDate = a as string;
    const rel = b as string;
    const timeZone = c as string;
    const { hour, minute, dayOffset } = parseRelativeTime(rel);
    const ymd = ymdAddDays(serviceDate, dayOffset, timeZone);
    const { y, m, d } = parseYMD(ymd);
    return zonedDateUTC(y, m, d, hour, minute, timeZone);
  }
  // 兼容旧签名：传入绝对时间与时区，返回该时区下的各字段
  const d = a as Date; const timeZone = b as string;
  const p = getPartsInZone(d, timeZone);
  return { year: p.year, month: p.month, day: p.day, hour: p.hour, minute: p.minute, date: d };
}

export function computeStationDateTimes(train: Train, serviceDate: string): StationTiming[] {
  return train.stations.map((st: Station) => {
    const res: StationTiming = { station: st };
    if (st.arrival_time) {
      const { hour, minute, dayOffset } = parseRelativeTime(st.arrival_time);
      const ymd = ymdAddDays(serviceDate, dayOffset, train.timezone);
      const { y, m, d } = parseYMD(ymd);
      res.arrivalAt = zonedDateUTC(y, m, d, hour, minute, train.timezone);
    }
    if (st.departure_time) {
      const { hour, minute, dayOffset } = parseRelativeTime(st.departure_time);
      const ymd = ymdAddDays(serviceDate, dayOffset, train.timezone);
      const { y, m, d } = parseYMD(ymd);
      res.departureAt = zonedDateUTC(y, m, d, hour, minute, train.timezone);
    }
    return res;
  });
}

export function todayInZone(timeZone: string, base: Date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
  // en-CA => YYYY-MM-DD
  return fmt.format(base);
}

export function computeNextDeparture(train: Train, fromIndex = 0, now: Date = new Date(), futureDays = 60): { date: string; when?: Date } | null {
  const startYmd = todayInZone(train.timezone, now);
  for (let i = 0; i < futureDays; i++) {
    const ymd = ymdAddDays(startYmd, i, train.timezone);
    // Calendar check is in calendar.ts to avoid circular deps; perform minimal check here: always consider date
    const first = train.stations[fromIndex];
    if (!first || !first.departure_time) continue;
    const { hour, minute, dayOffset } = parseRelativeTime(first.departure_time);
    const departYmd = ymdAddDays(ymd, dayOffset, train.timezone);
    const { y, m, d } = parseYMD(departYmd);
    const dt = zonedDateUTC(y, m, d, hour, minute, train.timezone);
    if (dt.getTime() > now.getTime()) return { date: ymd, when: dt };
  }
  return null;
}
