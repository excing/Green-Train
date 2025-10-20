/**
 * 运行日合并规则实现
 * 遵循 spec.zh-CN.md 3) 节的混合模式
 */

import type { Train, ServiceDate, TimezoneName, Calendar, CalendarRule, DateRange } from '$lib/types';
import { getWeekday, addDays, isDateInRange, compareDates, getTodayInTimezone } from './time';

/**
 * 计算日期范围内的所有日期
 */
function getDatesInRange(start: ServiceDate, end: ServiceDate): ServiceDate[] {
  const dates: ServiceDate[] = [];
  let current = start;
  
  while (compareDates(current, end) <= 0) {
    dates.push(current);
    current = addDays(current, 1);
  }
  
  return dates;
}

/**
 * 从日期范围对象生成日期集合
 */
function datesFromRange(range: DateRange, window: { start: ServiceDate; end: ServiceDate }, timezone: TimezoneName): Set<ServiceDate> {
  const dates = new Set<ServiceDate>();
  const rangeStart = compareDates(range.start, window.start) < 0 ? window.start : range.start;
  const rangeEnd = compareDates(range.end, window.end) > 0 ? window.end : range.end;
  
  const allDates = getDatesInRange(rangeStart, rangeEnd);
  
  for (const date of allDates) {
    if (!range.weekdays || range.weekdays.includes(getWeekday(date, timezone))) {
      dates.add(date);
    }
  }
  
  return dates;
}

/**
 * 从规则生成日期集合
 */
function datesFromRule(rule: CalendarRule, window: { start: ServiceDate; end: ServiceDate }, timezone: TimezoneName): Set<ServiceDate> {
  const dates = new Set<ServiceDate>();
  const ruleStart = compareDates(rule.start, window.start) < 0 ? window.start : rule.start;
  const ruleEnd = compareDates(rule.end, window.end) > 0 ? window.end : rule.end;
  
  const allDates = getDatesInRange(ruleStart, ruleEnd);
  
  if (rule.freq === 'DAILY') {
    allDates.forEach(date => dates.add(date));
  } else if (rule.freq === 'WEEKLY' && rule.weekdays) {
    for (const date of allDates) {
      if (rule.weekdays.includes(getWeekday(date, timezone))) {
        dates.add(date);
      }
    }
  }
  
  return dates;
}

/**
 * 计算列车在指定窗口内的运行日
 * 遵循排除优先原则：先加白再减黑
 */
export function computeServiceDates(
  train: Train,
  window: { start: ServiceDate; end: ServiceDate }
): ServiceDate[] {
  // draft 和 archived 状态不生成服务日期
  if (['draft', 'archived'].includes(train.status)) {
    return [];
  }

  const timezone = (train.timezone || 'Asia/Shanghai') as TimezoneName;
  let dates = new Set<ServiceDate>();

  // 1. 基础周模式
  if (train.service_days && train.service_days.length > 0) {
    const allDates = getDatesInRange(window.start, window.end);
    for (const date of allDates) {
      if (train.service_days.includes(getWeekday(date, timezone))) {
        dates.add(date);
      }
    }
  }
  
  const calendar = train.calendar || {};
  
  // 2. include_ranges
  if (calendar.include_ranges) {
    for (const range of calendar.include_ranges) {
      datesFromRange(range, window, timezone).forEach(d => dates.add(d));
    }
  }
  
  // 3. rules
  if (calendar.rules) {
    for (const rule of calendar.rules) {
      datesFromRule(rule, window, timezone).forEach(d => dates.add(d));
    }
  }
  
  // 4. includes
  if (calendar.includes) {
    for (const date of calendar.includes) {
      if (isDateInRange(date, window.start, window.end)) {
        dates.add(date);
      }
    }
  }
  
  // 5. exclude_ranges（排除优先）
  if (calendar.exclude_ranges) {
    for (const range of calendar.exclude_ranges) {
      datesFromRange(range, window, timezone).forEach(d => dates.delete(d));
    }
  }
  
  // 6. excludes（排除优先）
  if (calendar.excludes) {
    for (const date of calendar.excludes) {
      dates.delete(date);
    }
  }
  
  // 排序并返回
  return Array.from(dates).sort((a, b) => compareDates(a, b));
}

/**
 * 获取列车未来 N 天的运行日
 */
export function getUpcomingServiceDates(
  train: Train,
  days: number = 90,
  timezone: TimezoneName = 'Asia/Shanghai' as TimezoneName
): ServiceDate[] {
  const today = getTodayInTimezone(timezone);
  const endDate = addDays(today, days - 1);
  
  return computeServiceDates(train, { start: today, end: endDate });
}

/**
 * 检查列车是否在指定日期运行
 */
export function isTrainRunningOnDate(train: Train, date: ServiceDate): boolean {
  const dates = computeServiceDates(train, { start: date, end: date });
  return dates.length > 0;
}

/**
 * 获取列车下一个运行日
 */
export function getNextServiceDate(
  train: Train,
  fromDate: ServiceDate = getTodayInTimezone((train.timezone || 'Asia/Shanghai') as TimezoneName)
): ServiceDate | null {
  const endDate = addDays(fromDate, 365);
  const dates = computeServiceDates(train, { start: fromDate, end: endDate });
  
  return dates.length > 0 ? dates[0] : null;
}

