/**
 * 运行日计算逻辑
 */

import type { Train, DateString } from './types';
import { getDateRange, getWeekday, compareDates } from './time';

/**
 * 计算列车在指定时间窗口内的运行日
 * @param train 列车模板
 * @param from 开始日期 (YYYY-MM-DD)
 * @param to 结束日期 (YYYY-MM-DD)
 * @returns 排序后的运行日数组
 */
export function computeServiceDates(train: Train, from: DateString, to: DateString): DateString[] {
  // 不生成运行日的状态
  if (['draft', 'archived'].includes(train.status)) {
    return [];
  }

  const dates = new Set<DateString>();
  const allDates = getDateRange(from, to);

  // 1. 基础周模式
  if (train.service_days && train.service_days.length > 0) {
    for (const date of allDates) {
      const weekday = getWeekday(date, train.timezone);
      if (train.service_days.includes(weekday)) {
        dates.add(date);
      }
    }
  }

  // 2. include_ranges
  if (train.calendar?.include_ranges) {
    for (const range of train.calendar.include_ranges) {
      const rangeAllDates = getDateRange(range.start, range.end);
      for (const date of rangeAllDates) {
        if (compareDates(date, from) >= 0 && compareDates(date, to) <= 0) {
          if (!range.weekdays || range.weekdays.length === 0) {
            dates.add(date);
          } else {
            const weekday = getWeekday(date, train.timezone);
            if (range.weekdays.includes(weekday)) {
              dates.add(date);
            }
          }
        }
      }
    }
  }

  // 3. rules
  if (train.calendar?.rules) {
    for (const rule of train.calendar.rules) {
      const ruleAllDates = getDateRange(rule.start, rule.end);
      for (const date of ruleAllDates) {
        if (compareDates(date, from) >= 0 && compareDates(date, to) <= 0) {
          if (rule.freq === 'DAILY') {
            dates.add(date);
          } else if (rule.freq === 'WEEKLY' && rule.weekdays) {
            const weekday = getWeekday(date, train.timezone);
            if (rule.weekdays.includes(weekday)) {
              dates.add(date);
            }
          }
        }
      }
    }
  }

  // 4. includes
  if (train.calendar?.includes) {
    for (const date of train.calendar.includes) {
      if (compareDates(date, from) >= 0 && compareDates(date, to) <= 0) {
        dates.add(date);
      }
    }
  }

  // 5. exclude_ranges
  if (train.calendar?.exclude_ranges) {
    for (const range of train.calendar.exclude_ranges) {
      const rangeAllDates = getDateRange(range.start, range.end);
      for (const date of rangeAllDates) {
        if (!range.weekdays || range.weekdays.length === 0) {
          dates.delete(date);
        } else {
          const weekday = getWeekday(date, train.timezone);
          if (range.weekdays.includes(weekday)) {
            dates.delete(date);
          }
        }
      }
    }
  }

  // 6. excludes
  if (train.calendar?.excludes) {
    for (const date of train.calendar.excludes) {
      dates.delete(date);
    }
  }

  // 排序并返回
  return Array.from(dates).sort((a, b) => compareDates(a, b));
}

/**
 * 获取列车在指定日期之后的下一个运行日
 */
export function getNextServiceDate(
  train: Train,
  fromDate: DateString,
  lookAheadDays: number = 90
): DateString | null {
  const endDate = new Date(fromDate);
  endDate.setDate(endDate.getDate() + lookAheadDays);
  const endDateStr = endDate.toISOString().split('T')[0] as DateString;

  const serviceDates = computeServiceDates(train, fromDate, endDateStr);
  return serviceDates.length > 0 ? serviceDates[0] : null;
}

