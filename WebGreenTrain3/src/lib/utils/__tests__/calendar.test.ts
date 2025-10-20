/**
 * 日历工具测试
 */

import { describe, it, expect } from 'vitest';
import {
  computeServiceDates,
  getUpcomingServiceDates,
  isTrainRunningOnDate,
  getNextServiceDate
} from '../calendar';
import type { Train } from '$lib/types';

describe('Calendar Utils', () => {
  const mockTrain: Train = {
    id: 'K7701',
    name: 'K7701',
    theme: '聊聊诺兰的新电影',
    timezone: 'Asia/Shanghai',
    status: 'active',
    carriages: 10,
    rows_per_carriage: 20,
    departure_time: '08:35+00' as any,
    service_days: [1, 3, 5], // 周一、三、五
    sales_close_before_departure_minutes: 10,
    stations: [
      { name: '起始站', departure_time: '08:35+00' as any },
      { name: '终点站', arrival_time: '09:45+00' as any }
    ]
  };

  describe('computeServiceDates', () => {
    it('should compute service dates based on service_days', () => {
      const result = computeServiceDates(mockTrain, {
        start: '2025-08-11' as any,
        end: '2025-08-17' as any
      });

      // 2025-08-11 (周一), 2025-08-13 (周三), 2025-08-15 (周五)
      expect(result).toContain('2025-08-11');
      expect(result).toContain('2025-08-13');
      expect(result).toContain('2025-08-15');
      expect(result).not.toContain('2025-08-12'); // 周二
    });

    it('should handle includes correctly', () => {
      const trainWithIncludes: Train = {
        ...mockTrain,
        calendar: {
          includes: ['2025-08-12' as any] // 周二加开
        }
      };

      const result = computeServiceDates(trainWithIncludes, {
        start: '2025-08-11' as any,
        end: '2025-08-17' as any
      });

      expect(result).toContain('2025-08-12');
    });

    it('should handle excludes correctly (exclude priority)', () => {
      const trainWithExcludes: Train = {
        ...mockTrain,
        calendar: {
          excludes: ['2025-08-11' as any] // 周一停运
        }
      };

      const result = computeServiceDates(trainWithExcludes, {
        start: '2025-08-11' as any,
        end: '2025-08-17' as any
      });

      expect(result).not.toContain('2025-08-11');
      expect(result).toContain('2025-08-13');
    });

    it('should handle include_ranges correctly', () => {
      const trainWithRanges: Train = {
        ...mockTrain,
        service_days: undefined,
        calendar: {
          include_ranges: [
            {
              start: '2025-08-11' as any,
              end: '2025-08-17' as any,
              weekdays: [6, 7] // 周六、日
            }
          ]
        }
      };

      const result = computeServiceDates(trainWithRanges, {
        start: '2025-08-11' as any,
        end: '2025-08-17' as any
      });

      // 2025-08-16 (周六), 2025-08-17 (周日)
      expect(result).toContain('2025-08-16');
      expect(result).toContain('2025-08-17');
    });

    it('should handle rules correctly', () => {
      const trainWithRules: Train = {
        ...mockTrain,
        service_days: undefined,
        calendar: {
          rules: [
            {
              freq: 'DAILY',
              start: '2025-08-11' as any,
              end: '2025-08-13' as any
            }
          ]
        }
      };

      const result = computeServiceDates(trainWithRules, {
        start: '2025-08-11' as any,
        end: '2025-08-17' as any
      });

      expect(result).toContain('2025-08-11');
      expect(result).toContain('2025-08-12');
      expect(result).toContain('2025-08-13');
      expect(result).not.toContain('2025-08-14');
    });

    it('should handle WEEKLY rules correctly', () => {
      const trainWithWeeklyRules: Train = {
        ...mockTrain,
        service_days: undefined,
        calendar: {
          rules: [
            {
              freq: 'WEEKLY',
              weekdays: [6, 7],
              start: '2025-08-11' as any,
              end: '2025-08-31' as any
            }
          ]
        }
      };

      const result = computeServiceDates(trainWithWeeklyRules, {
        start: '2025-08-11' as any,
        end: '2025-08-31' as any
      });

      // 应该包含所有周六和周日
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('isTrainRunningOnDate', () => {
    it('should check if train is running on date', () => {
      expect(isTrainRunningOnDate(mockTrain, '2025-08-11' as any)).toBe(true); // 周一
      expect(isTrainRunningOnDate(mockTrain, '2025-08-12' as any)).toBe(false); // 周二
    });
  });

  describe('getNextServiceDate', () => {
    it('should get next service date', () => {
      const result = getNextServiceDate(mockTrain, '2025-08-11' as any);
      expect(result).toBe('2025-08-11'); // 周一是运行日
    });

    it('should skip non-running dates', () => {
      const result = getNextServiceDate(mockTrain, '2025-08-12' as any);
      expect(result).toBe('2025-08-13'); // 下一个运行日是周三
    });
  });

  describe('draft/archived trains', () => {
    it('should not generate service dates for draft trains', () => {
      const draftTrain: Train = {
        ...mockTrain,
        status: 'draft'
      };

      const result = computeServiceDates(draftTrain, {
        start: '2025-08-11' as any,
        end: '2025-08-17' as any
      });

      expect(result.length).toBe(0);
    });

    it('should not generate service dates for archived trains', () => {
      const archivedTrain: Train = {
        ...mockTrain,
        status: 'archived'
      };

      const result = computeServiceDates(archivedTrain, {
        start: '2025-08-11' as any,
        end: '2025-08-17' as any
      });

      expect(result.length).toBe(0);
    });
  });
});

