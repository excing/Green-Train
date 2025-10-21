import type { Train, TrainStation } from '$lib/types/trains';

export type RelTime = { hours: number; minutes: number; dayOffset: number };

const dtfCache = new Map<string, Intl.DateTimeFormat>();
function getDTF(tz: string) {
  let f = dtfCache.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    dtfCache.set(tz, f);
  }
  return f;
}

function pad2(n: number) { return n.toString().padStart(2, '0'); }

export function parseRelTime(rel: string): RelTime | null {
  const m = rel.match(/^([01][0-9]|2[0-3]):([0-5][0-9])\+([0-9]{2})$/);
  if (!m) return null;
  return { hours: parseInt(m[1], 10), minutes: parseInt(m[2], 10), dayOffset: parseInt(m[3], 10) };
}

function addDaysUTC(baseUtcMs: number, days: number): number {
  return baseUtcMs + days * 24 * 60 * 60 * 1000;
}

function partsToUTCms(parts: Record<string, string>): number {
  const y = parseInt(parts.year, 10);
  const m = parseInt(parts.month, 10);
  const d = parseInt(parts.day, 10);
  const hh = parseInt(parts.hour, 10);
  const mm = parseInt(parts.minute, 10);
  const ss = parseInt(parts.second, 10);
  return Date.UTC(y, m - 1, d, hh, mm, ss, 0);
}

function getOffsetMsForEpoch(epochMs: number, tz: string): number {
  const date = new Date(epochMs);
  const parts = Object.fromEntries(getDTF(tz).formatToParts(date).map((p) => [p.type, p.value]));
  const asUTC = partsToUTCms(parts);
  return asUTC - epochMs; // positive for east of UTC
}

export function toEpochFromLocalParts(y: number, m: number, d: number, hh: number, mm: number, tz: string): number {
  const t0 = Date.UTC(y, m - 1, d, hh, mm, 0, 0);
  const off0 = getOffsetMsForEpoch(t0, tz);
  const t1 = t0 - off0;
  const off1 = getOffsetMsForEpoch(t1, tz);
  if (off1 !== off0) {
    return t0 - off1;
  }
  return t1;
}

export function relativeToEpoch(service_date: string, rel: string, tz: string): number {
  const pr = parseRelTime(rel);
  if (!pr) throw new Error(`Bad rel time: ${rel}`);
  const [y, m, d] = service_date.split('-').map((v) => parseInt(v, 10));
  const baseUtc = Date.UTC(y, m - 1, d, 0, 0, 0, 0);
  const shifted = new Date(addDaysUTC(baseUtc, pr.dayOffset));
  const y2 = shifted.getUTCFullYear();
  const m2 = shifted.getUTCMonth() + 1;
  const d2 = shifted.getUTCDate();
  return toEpochFromLocalParts(y2, m2, d2, pr.hours, pr.minutes, tz);
}

export function localIsoWithOffset(epochMs: number, tz: string): string {
  const parts = Object.fromEntries(getDTF(tz).formatToParts(new Date(epochMs)).map((p) => [p.type, p.value]));
  const offMs = getOffsetMsForEpoch(epochMs, tz);
  const offMin = Math.round(offMs / 60000);
  const sign = offMin >= 0 ? '+' : '-';
  const abs = Math.abs(offMin);
  const oh = Math.floor(abs / 60);
  const om = abs % 60;
  const iso = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
  return `${iso}${sign}${pad2(oh)}:${pad2(om)}`;
}

export function utcIso(epochMs: number): string {
  return new Date(epochMs).toISOString();
}

export function relativeToAbs(service_date: string, rel: string, tz: string): { epochMs: number; localIso: string; utcIso: string; offsetMinutes: number } {
  const epochMs = relativeToEpoch(service_date, rel, tz);
  const localISO = localIsoWithOffset(epochMs, tz);
  const offMin = Math.round(getOffsetMsForEpoch(epochMs, tz) / 60000);
  return { epochMs, localIso: localISO, utcIso: utcIso(epochMs), offsetMinutes: offMin };
}

export function stationRelTime(s: TrainStation): string | null {
  return s.departure_time ?? s.arrival_time ?? null;
}

export function formatDurationMinutes(mins: number): string {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h === 0) return `${r}分钟`;
  if (r === 0) return `${h}小时`;
  return `${h}小时${r}分钟`;
}

export function defaultTZ(train?: Train): string {
  return train?.timezone || 'Asia/Shanghai';
}

export function formatHM(epochMs: number, tz?: string): string {
  const opt: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit', hour12: false };
  const f = new Intl.DateTimeFormat('zh-CN', tz ? { ...opt, timeZone: tz } : opt);
  const p = Object.fromEntries(f.formatToParts(new Date(epochMs)).map((x) => [x.type, x.value]));
  return `${p.hour}:${p.minute}`;
}
