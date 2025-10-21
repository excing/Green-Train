import type { Train, TrainCalendarRange, TrainCalendarRule } from '$lib/types/trains';
import { DateTime, Interval } from 'luxon';

export const DEFAULT_TZ = 'Asia/Shanghai';

export function getTrainTz(train: Pick<Train, 'timezone'>): string {
  return train.timezone || DEFAULT_TZ;
}

// HH:mm+dd parser
export function parseRel(rel: string): { hh: number; mm: number; dd: number } {
  const m = /^([01][0-9]|2[0-3]):([0-5][0-9])\+([0-9]{2})$/.exec(rel);
  if (!m) throw new Error(`Invalid relative time: ${rel}`);
  return { hh: Number(m[1]), mm: Number(m[2]), dd: Number(m[3]) };
}

// service_date: YYYY-MM-DD (train timezone calendar)
export function toZonedDateTime(service_date: string, rel: string, tz: string): DateTime {
  const { hh, mm, dd } = parseRel(rel);
  const start = DateTime.fromISO(service_date, { zone: tz }).startOf('day');
  return start.plus({ days: dd, hours: hh, minutes: mm });
}

export function stationDepartureRel(train: Train, fromIndex: number): string {
  const st = train.stations[fromIndex];
  if (!st) throw new Error('Invalid fromIndex');
  if (st.departure_time) return st.departure_time;
  // 始发站通常有 departure_time；若缺省则退回全局
  return train.departure_time;
}

export function stationArrivalRel(train: Train, toIndex: number): string {
  const st = train.stations[toIndex];
  if (!st) throw new Error('Invalid toIndex');
  if (st.arrival_time) return st.arrival_time;
  // 终到站通常只有 arrival_time
  throw new Error('arrival_time missing for non-terminal station');
}

export function departAbsTrainTZ(train: Train, service_date: string, fromIndex: number): DateTime {
  const tz = getTrainTz(train);
  const rel = stationDepartureRel(train, fromIndex);
  return toZonedDateTime(service_date, rel, tz);
}

export function arrivalAbsTrainTZ(train: Train, service_date: string, toIndex: number): DateTime {
  const tz = getTrainTz(train);
  const rel = stationArrivalRel(train, toIndex);
  return toZonedDateTime(service_date, rel, tz);
}

export function openAt(train: Train, service_date: string): DateTime | null {
  if (!train.sales_open_rel) return null; // 随时可买
  return toZonedDateTime(service_date, train.sales_open_rel, getTrainTz(train));
}

export function closeAt(train: Train, service_date: string, fromIndex: number): DateTime {
  const depart = departAbsTrainTZ(train, service_date, fromIndex);
  return depart.minus({ minutes: train.sales_close_before_departure_minutes });
}

export function isRunnableStatus(status: Train['status']): boolean {
  return status !== 'draft' && status !== 'archived';
}

export function isSellableStatus(status: Train['status']): boolean {
  // hidden 允许售卖
  return status !== 'draft' && status !== 'archived' && status !== 'paused';
}

export function isOnSale(train: Train, service_date: string, fromIndex: number, now: DateTime): boolean {
  if (!isSellableStatus(train.status)) return false;
  // service_date 应在可运行日内：由调用方保证或这里判断
  const open = openAt(train, service_date);
  const close = closeAt(train, service_date, fromIndex);
  if (now >= close) return false;
  if (open && now < open) return false;
  return true;
}

// 计算运行日集合：混合模式（排除优先）
export function computeServiceDates(train: Train, fromDate: string, toDate: string): string[] {
  if (!isRunnableStatus(train.status)) return [];
  const tz = getTrainTz(train);
  let start = DateTime.fromISO(fromDate, { zone: tz }).startOf('day');
  const end = DateTime.fromISO(toDate, { zone: tz }).startOf('day');
  if (end < start) return [];

  const baseSet = new Set<string>();
  // 1) 基础周模式
  if (train.service_days && train.service_days.length) {
    for (let d = start; d <= end; d = d.plus({ days: 1 })) {
      if (train.service_days!.includes(d.weekday)) baseSet.add(d.toISODate()!);
    }
  }

  // helpers
  const addRange = (r: TrainCalendarRange, set: Set<string>) => {
    let s = DateTime.fromISO(r.start, { zone: tz }).startOf('day');
    const e = DateTime.fromISO(r.end, { zone: tz }).startOf('day');
    for (let d = s; d <= e; d = d.plus({ days: 1 })) {
      if (!r.weekdays || r.weekdays.includes(d.weekday)) set.add(d.toISODate()!);
    }
  };

  const rulesToDates = (rule: TrainCalendarRule, set: Set<string>) => {
    let s = DateTime.fromISO(rule.start, { zone: tz }).startOf('day');
    const e = DateTime.fromISO(rule.end, { zone: tz }).startOf('day');
    if (rule.freq === 'DAILY') {
      for (let d = s; d <= e; d = d.plus({ days: 1 })) set.add(d.toISODate()!);
    } else {
      for (let d = s; d <= e; d = d.plus({ days: 1 })) {
        if (rule.weekdays && rule.weekdays.includes(d.weekday)) set.add(d.toISODate()!);
      }
    }
  };

  const S = new Set<string>(baseSet);
  const cal = train.calendar;
  if (cal?.include_ranges) cal.include_ranges.forEach((r) => addRange(r, S));
  if (cal?.rules) cal.rules.forEach((r) => rulesToDates(r, S));
  if (cal?.includes) cal.includes.forEach((d) => S.add(d));
  // 排除优先
  if (cal?.exclude_ranges) cal.exclude_ranges.forEach((r) => {
    let s = DateTime.fromISO(r.start, { zone: tz }).startOf('day');
    const e = DateTime.fromISO(r.end, { zone: tz }).startOf('day');
    for (let d = s; d <= e; d = d.plus({ days: 1 })) {
      if (!r.weekdays || r.weekdays.includes(d.weekday)) S.delete(d.toISODate()!);
    }
  });
  if (cal?.excludes) cal.excludes.forEach((d) => S.delete(d));

  // 仅保留窗口内
  const win = Interval.fromDateTimes(start, end.plus({ days: 1 }));
  const result = Array.from(S)
    .map((iso) => DateTime.fromISO(iso, { zone: tz }).startOf('day'))
    .filter((d) => win.contains(d))
    .sort((a, b) => a.toMillis() - b.toMillis())
    .map((d) => d.toISODate()!);
  return result;
}

export function computeNextDeparture(train: Train, now: DateTime, windowDays = 90): { service_date: string; depart: DateTime } | null {
  const tz = getTrainTz(train);
  const todayTz = now.setZone(tz).toISODate()!;
  const end = DateTime.fromISO(todayTz, { zone: tz }).plus({ days: windowDays }).toISODate()!;
  const serviceDates = computeServiceDates(train, todayTz, end);
  for (const d of serviceDates) {
    const depart = departAbsTrainTZ(train, d, 0);
    if (depart >= now.setZone(tz)) {
      return { service_date: d, depart };
    }
  }
  return null;
}

export function pointsCost(train: Train, fromIndex: number, toIndex: number): number {
  let sum = 0;
  for (let k = fromIndex + 1; k <= toIndex; k++) sum += train.stations[k].points ?? 0;
  return sum;
}

export function humanizeDurationMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${h}小时${m}分`;
  if (h) return `${h}小时`;
  return `${m}分`;
}

export function padRow(row: number): string {
  return row.toString().padStart(2, '0');
}

export function formatDual(dtTrain: DateTime): { local: string; train: string } {
  const local = dtTrain.setZone('local').toISO({ suppressMilliseconds: true });
  const train = dtTrain.toISO({ suppressMilliseconds: true });
  return { local: local || '', train: train || '' };
}
