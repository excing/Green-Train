import type { Train } from '$lib/types/trains';
import { defaultTZ, relativeToAbs } from './datetime';
import { mergeServiceDays } from './calendar';

export function openAt(train: Train, service_date: string): { epochMs: number; localIso: string } | null {
  const tz = defaultTZ(train);
  if (!train.sales_open_rel) return null;
  const abs = relativeToAbs(service_date, train.sales_open_rel, tz);
  return { epochMs: abs.epochMs, localIso: abs.localIso };
}

export function closeAt(train: Train, service_date: string, from_station_index: number): { epochMs: number; localIso: string } {
  const tz = defaultTZ(train);
  const rel = train.stations[from_station_index]?.departure_time;
  if (!rel) throw new Error('from_station has no departure_time');
  const abs = relativeToAbs(service_date, rel, tz);
  const closeEpoch = abs.epochMs - train.sales_close_before_departure_minutes * 60 * 1000;
  const closeIsoLocal = abs.localIso; // local of departure
  // But we need local of close time in same tz
  const closeAbsLocal = new Date(closeEpoch);
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).formatToParts(closeAbsLocal).map((p) => [p.type, p.value]));
  const iso = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
  // offset string
  const dt = new Date(closeEpoch);
  const zparts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(dt).map(p => [p.type, p.value]));
  const offMin = Math.round((Date.UTC(parseInt(zparts.year,10), parseInt(zparts.month,10)-1, parseInt(zparts.day,10), parseInt(zparts.hour,10), parseInt(zparts.minute,10), parseInt(zparts.second,10)) - closeEpoch) / 60000);
  const sign = offMin >= 0 ? '+' : '-';
  const absMin = Math.abs(offMin);
  const oh = Math.floor(absMin / 60).toString().padStart(2, '0');
  const om = (absMin % 60).toString().padStart(2, '0');
  const localIso = `${iso}${sign}${oh}:${om}`;
  return { epochMs: closeEpoch, localIso };
}

export function isOnSale(now: number, train: Train, service_date: string, from_station_index: number): { onSale: boolean; reason?: 'PAUSED'|'NOT_RUNNING_DAY'|'BEFORE_OPEN'|'AFTER_CLOSE' } {
  if (train.status === 'paused' || train.status === 'draft' || train.status === 'archived') {
    return { onSale: false, reason: 'PAUSED' };
  }
  const { from, to } = { from: service_date, to: service_date };
  const days = mergeServiceDays(train, from, to);
  if (!days.includes(service_date)) {
    return { onSale: false, reason: 'NOT_RUNNING_DAY' };
  }
  const open = openAt(train, service_date);
  const close = closeAt(train, service_date, from_station_index);
  if (open && now < open.epochMs) return { onSale: false, reason: 'BEFORE_OPEN' };
  if (now >= close.epochMs) return { onSale: false, reason: 'AFTER_CLOSE' };
  return { onSale: true };
}
