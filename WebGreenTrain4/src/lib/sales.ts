/**
 * 售票逻辑
 */

import type { Train, DateString, ISOString, RelativeTime } from './types';
import { toLocalAbsoluteTime, toUTCISO, compareISO, diffMinutes, getNowISO } from './time';
import { computeServiceDates } from './calendar';

/**
 * 计算开售时间
 */
export function getOpenAt(
  train: Train,
  serviceDate: DateString
): ISOString | null {
  if (!train.sales_open_rel) {
    return null; // 随时可买
  }
  return toLocalAbsoluteTime(serviceDate, train.sales_open_rel, train.timezone);
}

/**
 * 计算停售时间
 */
export function getCloseAt(
  train: Train,
  serviceDate: DateString,
  fromStationIndex: number
): ISOString {
  const station = train.stations[fromStationIndex];
  if (!station) {
    throw new Error(`Invalid station index: ${fromStationIndex}`);
  }

  const departureTime = station.departure_time || train.departure_time;
  const departAbsLocal = toLocalAbsoluteTime(serviceDate, departureTime, train.timezone);
  
  // 转换为 UTC 后减去分钟数
  const departAbsUTC = toUTCISO(departAbsLocal);
  const closeAtUTC = new Date(new Date(departAbsUTC).getTime() - train.sales_close_before_departure_minutes * 60000).toISOString() as ISOString;
  
  return closeAtUTC;
}

/**
 * 检查是否在售
 */
export function isOnSale(
  train: Train,
  now: ISOString,
  serviceDate: DateString,
  fromStationIndex: number
): boolean {
  // 检查状态
  if (['draft', 'archived', 'paused'].includes(train.status)) {
    return false;
  }

  // 检查是否是有效的运行日
  const today = new Date(now).toISOString().split('T')[0] as DateString;
  const serviceDates = computeServiceDates(train, today, serviceDate);
  if (!serviceDates.includes(serviceDate)) {
    return false;
  }

  // 检查停售时间
  const closeAt = getCloseAt(train, serviceDate, fromStationIndex);
  if (compareISO(closeAt, now) <= 0) {
    return false;
  }

  // 检查开售时间
  const openAt = getOpenAt(train, serviceDate);
  if (openAt && compareISO(now, openAt) < 0) {
    return false;
  }

  return true;
}

/**
 * 获取售票状态文案
 */
export function getSalesStatusText(
  train: Train,
  now: ISOString,
  serviceDate: DateString,
  fromStationIndex: number
): string {
  if (['draft', 'archived'].includes(train.status)) {
    return '未上线';
  }

  if (train.status === 'paused') {
    return '暂停售票';
  }

  const today = new Date(now).toISOString().split('T')[0] as DateString;
  const serviceDates = computeServiceDates(train, today, serviceDate);
  if (!serviceDates.includes(serviceDate)) {
    return '未运行';
  }

  const closeAt = getCloseAt(train, serviceDate, fromStationIndex);
  if (compareISO(closeAt, now) <= 0) {
    return '已停售';
  }

  const openAt = getOpenAt(train, serviceDate);
  if (openAt && compareISO(now, openAt) < 0) {
    const minutesUntilOpen = diffMinutes(now, openAt);
    if (minutesUntilOpen > 60) {
      const hoursUntilOpen = Math.ceil(minutesUntilOpen / 60);
      return `${hoursUntilOpen}小时后开售`;
    }
    return `${minutesUntilOpen}分钟后开售`;
  }

  return '可购';
}

/**
 * 计算距离停售的剩余时间（分钟）
 */
export function getMinutesUntilClose(
  train: Train,
  now: ISOString,
  serviceDate: DateString,
  fromStationIndex: number
): number {
  const closeAt = getCloseAt(train, serviceDate, fromStationIndex);
  return diffMinutes(now, closeAt);
}

