/**
 * 售票开闭计算模块
 * 遵循 spec.zh-CN.md 4) 节的售票规则
 */

import type { Train, ServiceDate, ISODateTime, TimezoneName } from '$lib/types';
import { toLocalAbsoluteTime, parseRelativeTime, getTodayInTimezone } from './time';
import { isTrainRunningOnDate } from './calendar';

/**
 * 计算开售时间
 */
export function getOpenAt(
  train: Train,
  serviceDate: ServiceDate
): ISODateTime | null {
  if (!train.sales_open_rel) {
    return null; // 无开售时间限制
  }
  
  const timezone = (train.timezone || 'Asia/Shanghai') as TimezoneName;
  return toLocalAbsoluteTime(serviceDate, train.sales_open_rel, timezone);
}

/**
 * 计算停售时间
 * @param fromStationIndex 上车站索引
 */
export function getCloseAt(
  train: Train,
  serviceDate: ServiceDate,
  fromStationIndex: number
): ISODateTime {
  const timezone = (train.timezone || 'Asia/Shanghai') as TimezoneName;

  // 获取上车站的发车时刻
  const station = train.stations[fromStationIndex];
  if (!station || !station.departure_time) {
    throw new Error(`Invalid station index: ${fromStationIndex}`);
  }

  // 计算发车的绝对时间（本地时区）
  const departAbsLocal = toLocalAbsoluteTime(serviceDate, station.departure_time, timezone);

  // 减去停售提前分钟数
  const departDate = new Date(departAbsLocal);
  const closeDate = new Date(departDate.getTime() - train.sales_close_before_departure_minutes * 60 * 1000);

  // 转换回本地时区格式
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: timezone
  });

  const parts = formatter.formatToParts(closeDate);
  const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));

  // 计算时区偏移
  const offset = getTimezoneOffset(closeDate, timezone);
  const offsetStr = formatOffset(offset);

  const localTimeStr = `${partMap.year}-${partMap.month}-${partMap.day}T${partMap.hour}:${partMap.minute}:${partMap.second}${offsetStr}`;

  return localTimeStr as ISODateTime;
}

/**
 * 获取时区偏移（分钟）
 */
function getTimezoneOffset(date: Date, timezone: TimezoneName): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));

  return (utcDate.getTime() - tzDate.getTime()) / (1000 * 60);
}

/**
 * 格式化时区偏移为 ±HH:mm
 */
function formatOffset(minutes: number): string {
  const sign = minutes <= 0 ? '+' : '-';
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;

  return `${sign}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * 检查列车是否在售
 */
export function isOnSale(
  train: Train,
  now: ISODateTime,
  serviceDate: ServiceDate,
  fromStationIndex: number
): boolean {
  // 1. 检查状态
  if (['draft', 'archived', 'paused'].includes(train.status)) {
    return false;
  }
  
  // 2. 检查是否在运行日
  if (!isTrainRunningOnDate(train, serviceDate)) {
    return false;
  }
  
  // 3. 检查停售时间
  const closeAt = getCloseAt(train, serviceDate, fromStationIndex);
  if (new Date(now) >= new Date(closeAt)) {
    return false;
  }
  
  // 4. 检查开售时间
  const openAt = getOpenAt(train, serviceDate);
  if (openAt && new Date(now) < new Date(openAt)) {
    return false;
  }
  
  return true;
}

/**
 * 获取列车的售卖状态文案
 */
export function getSalesStatus(
  train: Train,
  now: ISODateTime,
  serviceDate: ServiceDate,
  fromStationIndex: number
): 'available' | 'not_started' | 'closed' | 'paused' | 'unavailable' {
  // 检查状态
  if (train.status === 'paused') {
    return 'paused';
  }
  
  if (['draft', 'archived'].includes(train.status)) {
    return 'unavailable';
  }
  
  // 检查是否在运行日
  if (!isTrainRunningOnDate(train, serviceDate)) {
    return 'unavailable';
  }
  
  // 检查开售时间
  const openAt = getOpenAt(train, serviceDate);
  if (openAt && new Date(now) < new Date(openAt)) {
    return 'not_started';
  }
  
  // 检查停售时间
  const closeAt = getCloseAt(train, serviceDate, fromStationIndex);
  if (new Date(now) >= new Date(closeAt)) {
    return 'closed';
  }
  
  return 'available';
}

/**
 * 计算距离停售的剩余时间（秒）
 */
export function getTimeUntilClose(
  train: Train,
  now: ISODateTime,
  serviceDate: ServiceDate,
  fromStationIndex: number
): number {
  const closeAt = getCloseAt(train, serviceDate, fromStationIndex);
  const closeTime = new Date(closeAt).getTime();
  const nowTime = new Date(now).getTime();
  
  return Math.max(0, Math.floor((closeTime - nowTime) / 1000));
}

/**
 * 计算距离开售的剩余时间（秒）
 */
export function getTimeUntilOpen(
  train: Train,
  now: ISODateTime,
  serviceDate: ServiceDate
): number | null {
  const openAt = getOpenAt(train, serviceDate);
  if (!openAt) return null;
  
  const openTime = new Date(openAt).getTime();
  const nowTime = new Date(now).getTime();
  
  return Math.max(0, Math.floor((openTime - nowTime) / 1000));
}

/**
 * 获取列车在指定日期的售卖窗口
 */
export function getSalesWindow(
  train: Train,
  serviceDate: ServiceDate,
  fromStationIndex: number
): { openAt: ISODateTime | null; closeAt: ISODateTime } {
  return {
    openAt: getOpenAt(train, serviceDate),
    closeAt: getCloseAt(train, serviceDate, fromStationIndex)
  };
}

