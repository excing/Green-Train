// 售票窗口计算：确定开售、停售时间并判断销售状态
import type { Train } from './types';
import { computeStationDateTimes, parseRelativeTime } from './time';

export function computeSalesOpenAt(train: Train, serviceDate: string): Date {
  const { hour, minute, dayOffset } = parseRelativeTime(train.sales_open_rel);
  // 开售按服务日计算
  const { timezone } = train;
  // Defer to time.zonedDateUTC without direct import to avoid circular? We can reconstruct inline to minimize deps
  // But computeStationDateTimes already imports tz helper; we can reuse via first station calculation approach
  const timings = computeStationDateTimes(train, serviceDate);
  const base = timings?.[0]?.departureAt ?? new Date();
  // base is the first station departureAt on serviceDate. Build the openAt by replacing time-of-day and dayOffset.
  const baseLocal = new Date(base.getTime());
  // We'll compute by constructing a new date in train TZ using helpers embedded here to avoid cycles.
  const ymd = serviceDate;
  const open = zonedByParts(ymd, hour, minute, dayOffset, timezone);
  return open;
}

export function computeSalesCloseAt(train: Train, serviceDate: string, fromIndex = 0): Date | null {
  const timings = computeStationDateTimes(train, serviceDate);
  const st = timings[fromIndex];
  const depart = st?.departureAt;
  if (!depart) return null;
  const closeMs = train.sales_close_before_departure_minutes * 60_000;
  return new Date(depart.getTime() - closeMs);
}

export function isOnSale(train: Train, serviceDate: string, fromIndex = 0, now: Date = new Date()): boolean {
  const open = computeSalesOpenAt(train, serviceDate);
  const close = computeSalesCloseAt(train, serviceDate, fromIndex);
  if (!close) return false;
  return now.getTime() >= open.getTime() && now.getTime() <= close.getTime();
}

// local helper (duplicate logic to avoid importing private helpers)
function zonedByParts(ymd: string, hour: number, minute: number, dayOffset: number, timeZone: string): Date {
  const { y, m, d } = ((): { y: number; m: number; d: number } => {
    const mm = ymd.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!mm) throw new Error('Invalid date');
    return { y: parseInt(mm[1], 10), m: parseInt(mm[2], 10), d: parseInt(mm[3], 10) };
  })();
  const at = (date: Date) => {
    const fmt = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    const parts = fmt.formatToParts(date);
    const get = (t: Intl.DateTimeFormatPartTypes) => parseInt(parts.find(p => p.type === t)?.value ?? '0', 10);
    const asUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
    return Math.round((asUTC - date.getTime()) / 60000);
  };
  const addDays = (y: number, m: number, d: number, add: number) => {
    const approx = new Date(Date.UTC(y, m - 1, d, 12, 0));
    const later = new Date(approx.getTime() + add * 86400000);
    const f = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' });
    const s = f.format(later);
    const m2 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)!;
    return { y: parseInt(m2[1], 10), m: parseInt(m2[2], 10), d: parseInt(m2[3], 10) };
  };
  const base = addDays(y, m, d, dayOffset);
  const approx = new Date(Date.UTC(base.y, base.m - 1, base.d, hour, minute));
  const off1 = at(approx);
  const epoch = Date.UTC(base.y, base.m - 1, base.d, hour, minute) - off1 * 60000;
  const approx2 = new Date(epoch);
  const off2 = at(approx2);
  const final = Date.UTC(base.y, base.m - 1, base.d, hour, minute) - off2 * 60000;
  return new Date(final);
}
