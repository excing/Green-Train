import type { Train } from '$lib/types/trains';
import { clampServiceWindow, mergeServiceDays } from './calendar';
import { defaultTZ, relativeToAbs } from './datetime';

export type NextDeparture = { service_date: string; epochMs: number; localIso: string } | null;

export function computeNextDeparture(train: Train, now: number, windowDays = 90): NextDeparture {
  const tz = defaultTZ(train);
  const { from, to } = clampServiceWindow(train, windowDays);
  const days = mergeServiceDays(train, from, to);
  if (days.length === 0) return null;
  const rel = train.stations?.[0]?.departure_time || train.departure_time;
  for (const d of days) {
    const abs = relativeToAbs(d, rel, tz);
    if (abs.epochMs >= now) {
      return { service_date: d, epochMs: abs.epochMs, localIso: abs.localIso };
    }
  }
  // 若都在过去，返回窗口内最后一班（用于展示，不作为可购依据）
  const last = days[days.length - 1];
  const abs = relativeToAbs(last, rel, tz);
  return { service_date: last, epochMs: abs.epochMs, localIso: abs.localIso };
}
