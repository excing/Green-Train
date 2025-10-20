/**
 * 时间与时区处理工具
 * 遵循 spec.zh-CN.md 1) 节的时间约定
 */

import type { RelativeTime, ServiceDate, ISODateTime, TimezoneName } from '$lib/types';

/**
 * 验证相对时刻格式 HH:mm+dd
 * @example "08:35+00", "00:40+01"
 */
export function isValidRelativeTime(time: string): time is RelativeTime {
  const regex = /^([01][0-9]|2[0-3]):([0-5][0-9])\+([0-9]{2})$/;
  return regex.test(time);
}

/**
 * 验证服务日期格式 YYYY-MM-DD
 */
export function isValidServiceDate(date: string): date is ServiceDate {
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(date)) return false;
  
  const d = new Date(date + 'T00:00:00Z');
  return !isNaN(d.getTime());
}

/**
 * 解析相对时刻
 * @returns { hours, minutes, days }
 */
export function parseRelativeTime(relTime: RelativeTime): { hours: number; minutes: number; days: number } {
  const match = relTime.match(/^(\d{2}):(\d{2})\+(\d{2})$/);
  if (!match) throw new Error(`Invalid relative time: ${relTime}`);
  
  return {
    hours: parseInt(match[1], 10),
    minutes: parseInt(match[2], 10),
    days: parseInt(match[3], 10)
  };
}

/**
 * 将相对时刻转换为绝对时间（本地时区）
 * @param serviceDate 服务日期 (YYYY-MM-DD)
 * @param relTime 相对时刻 (HH:mm+dd)
 * @param timezone IANA 时区名
 * @returns ISO 8601 字符串（含时区偏移）
 */
export function toLocalAbsoluteTime(
  serviceDate: ServiceDate,
  relTime: RelativeTime,
  timezone: TimezoneName = 'Asia/Shanghai' as TimezoneName
): ISODateTime {
  const { hours, minutes, days } = parseRelativeTime(relTime);

  // 计算目标日期
  const targetDate = addDays(serviceDate, days);

  // 创建一个本地时间字符串（不含时区信息）
  const localTimeStr = `${targetDate}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;

  // 使用 Intl API 获取该本地时间对应的 UTC 时间
  // 方法：创建一个 UTC 时间，然后在指定时区中格式化，比较直到找到匹配
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

  // 二分查找找到对应的 UTC 时间
  let low = new Date(targetDate + 'T00:00:00Z').getTime() - 24 * 60 * 60 * 1000;
  let high = new Date(targetDate + 'T23:59:59Z').getTime() + 24 * 60 * 60 * 1000;

  for (let i = 0; i < 50; i++) {
    const mid = (low + high) / 2;
    const midDate = new Date(mid);
    const parts = formatter.formatToParts(midDate);
    const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));

    const midHour = parseInt(partMap.hour, 10);
    const midMin = parseInt(partMap.minute, 10);
    const midDateStr = `${partMap.year}-${partMap.month}-${partMap.day}`;

    if (midDateStr === targetDate && midHour === hours && midMin === minutes) {
      // 找到了精确匹配
      const offset = getTimezoneOffset(midDate, timezone);
      const offsetStr = formatOffset(offset);
      return `${localTimeStr}${offsetStr}` as ISODateTime;
    }

    // 比较时间大小
    const midTime = midHour * 60 + midMin;
    const targetTime = hours * 60 + minutes;

    if (midDateStr < targetDate || (midDateStr === targetDate && midTime < targetTime)) {
      low = mid;
    } else {
      high = mid;
    }
  }

  // 如果没有找到精确匹配，使用最接近的
  const resultDate = new Date((low + high) / 2);
  const offset = getTimezoneOffset(resultDate, timezone);
  const offsetStr = formatOffset(offset);

  return `${localTimeStr}${offsetStr}` as ISODateTime;
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
 * 将本地时间转换为 UTC ISO 字符串
 */
export function toUTCISO(localISOString: ISODateTime): ISODateTime {
  const date = new Date(localISOString);
  return date.toISOString() as ISODateTime;
}

/**
 * 获取当前日期（指定时区）
 */
export function getTodayInTimezone(timezone: TimezoneName = 'Asia/Shanghai' as TimezoneName): ServiceDate {
  const formatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: timezone
  });
  
  const parts = formatter.formatToParts(new Date());
  const partMap = Object.fromEntries(parts.map(p => [p.type, p.value]));
  
  return `${partMap.year}-${partMap.month}-${partMap.day}` as ServiceDate;
}

/**
 * 获取周几（1=周一，7=周日）
 */
export function getWeekday(date: ServiceDate, timezone: TimezoneName = 'Asia/Shanghai' as TimezoneName): number {
  const d = new Date(date + 'T00:00:00Z');
  const formatter = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: timezone
  });
  
  const weekdayName = formatter.format(d);
  const weekdays: Record<string, number> = {
    'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4,
    'Friday': 5, 'Saturday': 6, 'Sunday': 7
  };
  
  return weekdays[weekdayName] || 0;
}

/**
 * 日期加法
 */
export function addDays(date: ServiceDate, days: number): ServiceDate {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}` as ServiceDate;
}

/**
 * 日期比较
 */
export function compareDates(date1: ServiceDate, date2: ServiceDate): number {
  return date1.localeCompare(date2);
}

/**
 * 检查日期是否在范围内（含边界）
 */
export function isDateInRange(date: ServiceDate, start: ServiceDate, end: ServiceDate): boolean {
  return compareDates(date, start) >= 0 && compareDates(date, end) <= 0;
}

