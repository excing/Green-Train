/**
 * 时间处理工具函数
 */

import { DateTime } from 'luxon';
import type { RelativeTime, DateString, ISOString } from './types';

/**
 * 验证相对时刻格式 HH:mm+dd
 */
export function isValidRelativeTime(time: string): time is RelativeTime {
  const regex = /^([01][0-9]|2[0-3]):([0-5][0-9])\+([0-9]{2})$/;
  return regex.test(time);
}

/**
 * 验证日期格式 YYYY-MM-DD
 */
export function isValidDateString(date: string): date is DateString {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;
  try {
    const dt = DateTime.fromISO(date);
    return dt.isValid;
  } catch {
    return false;
  }
}

/**
 * 将相对时刻转换为本地绝对时间
 * @param serviceDate 服务日期 (YYYY-MM-DD)
 * @param relativeTime 相对时刻 (HH:mm+dd)
 * @param timezone IANA 时区名
 * @returns ISO 8601 字符串（包含偏移）
 */
export function toLocalAbsoluteTime(
  serviceDate: DateString,
  relativeTime: RelativeTime,
  timezone: string
): ISOString {
  const match = relativeTime.match(/^(\d{2}):(\d{2})\+(\d{2})$/);
  if (!match) throw new Error(`Invalid relative time: ${relativeTime}`);

  const [, hours, minutes, days] = match;
  const dt = DateTime.fromISO(serviceDate, { zone: timezone })
    .plus({ days: parseInt(days, 10), hours: parseInt(hours, 10), minutes: parseInt(minutes, 10) });

  if (!dt.isValid) throw new Error(`Invalid date/time: ${serviceDate} ${relativeTime}`);

  return dt.toISO() as ISOString;
}

/**
 * 将本地时间转换为 UTC ISO 字符串
 */
export function toUTCISO(localISO: ISOString): ISOString {
  const dt = DateTime.fromISO(localISO);
  if (!dt.isValid) throw new Error(`Invalid ISO string: ${localISO}`);
  return dt.toUTC().toISO() as ISOString;
}

/**
 * 获取日期的周几 (1=周一, 7=周日)
 */
export function getWeekday(date: DateString, timezone: string): number {
  const dt = DateTime.fromISO(date, { zone: timezone });
  if (!dt.isValid) throw new Error(`Invalid date: ${date}`);
  // Luxon: 1=周一, 7=周日 (与规范一致)
  return dt.weekday;
}

/**
 * 比较两个日期
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareDates(a: DateString, b: DateString): number {
  const dtA = DateTime.fromISO(a);
  const dtB = DateTime.fromISO(b);
  if (dtA < dtB) return -1;
  if (dtA > dtB) return 1;
  return 0;
}

/**
 * 获取日期范围内的所有日期
 */
export function getDateRange(start: DateString, end: DateString): DateString[] {
  const dates: DateString[] = [];
  let current = DateTime.fromISO(start);
  const endDt = DateTime.fromISO(end);

  while (current <= endDt) {
    dates.push(current.toISODate() as DateString);
    current = current.plus({ days: 1 });
  }

  return dates;
}

/**
 * 获取当前日期 (YYYY-MM-DD)
 */
export function getTodayString(timezone: string = 'Asia/Shanghai'): DateString {
  return DateTime.now().setZone(timezone).toISODate() as DateString;
}

/**
 * 获取当前时间 (ISO 8601)
 */
export function getNowISO(): ISOString {
  return DateTime.now().toISO() as ISOString;
}

/**
 * 比较两个 ISO 时间
 * @returns -1 if a < b, 0 if a === b, 1 if a > b
 */
export function compareISO(a: ISOString, b: ISOString): number {
  const dtA = DateTime.fromISO(a);
  const dtB = DateTime.fromISO(b);
  if (dtA < dtB) return -1;
  if (dtA > dtB) return 1;
  return 0;
}

/**
 * 计算两个 ISO 时间的差值（分钟）
 */
export function diffMinutes(a: ISOString, b: ISOString): number {
  const dtA = DateTime.fromISO(a);
  const dtB = DateTime.fromISO(b);
  return Math.round(dtB.diff(dtA, 'minutes').minutes);
}

