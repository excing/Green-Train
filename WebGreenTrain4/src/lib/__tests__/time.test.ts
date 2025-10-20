/**
 * 时间处理工具函数测试
 */

import { describe, it, expect } from 'vitest';
import {
  isValidRelativeTime,
  isValidDateString,
  toLocalAbsoluteTime,
  getWeekday,
  compareDates,
  getDateRange
} from '../time';

describe('Time utilities', () => {
  describe('isValidRelativeTime', () => {
    it('should validate correct relative time format', () => {
      expect(isValidRelativeTime('08:35+00')).toBe(true);
      expect(isValidRelativeTime('23:59+02')).toBe(true);
      expect(isValidRelativeTime('00:00+00')).toBe(true);
    });

    it('should reject invalid relative time format', () => {
      expect(isValidRelativeTime('24:00+00')).toBe(false);
      expect(isValidRelativeTime('08:60+00')).toBe(false);
      expect(isValidRelativeTime('08:35')).toBe(false);
      expect(isValidRelativeTime('08:35+100')).toBe(false);
    });
  });

  describe('isValidDateString', () => {
    it('should validate correct date format', () => {
      expect(isValidDateString('2025-08-16')).toBe(true);
      expect(isValidDateString('2025-01-01')).toBe(true);
      expect(isValidDateString('2025-12-31')).toBe(true);
    });

    it('should reject invalid date format', () => {
      expect(isValidDateString('2025-13-01')).toBe(false);
      expect(isValidDateString('2025-08-32')).toBe(false);
      expect(isValidDateString('08-16-2025')).toBe(false);
    });
  });

  describe('toLocalAbsoluteTime', () => {
    it('should convert relative time to absolute time', () => {
      const result = toLocalAbsoluteTime('2025-08-16' as any, '08:35+00' as any, 'Asia/Shanghai');
      expect(result).toContain('2025-08-16');
      expect(result).toContain('08:35');
    });

    it('should handle cross-day times', () => {
      const result = toLocalAbsoluteTime('2025-08-16' as any, '00:40+01' as any, 'Asia/Shanghai');
      expect(result).toContain('2025-08-17');
      expect(result).toContain('00:40');
    });
  });

  describe('getWeekday', () => {
    it('should return correct weekday', () => {
      // 2025-08-16 is Saturday (6)
      const weekday = getWeekday('2025-08-16' as any, 'Asia/Shanghai');
      expect(weekday).toBe(6);
    });
  });

  describe('compareDates', () => {
    it('should compare dates correctly', () => {
      expect(compareDates('2025-08-15' as any, '2025-08-16' as any)).toBe(-1);
      expect(compareDates('2025-08-16' as any, '2025-08-16' as any)).toBe(0);
      expect(compareDates('2025-08-17' as any, '2025-08-16' as any)).toBe(1);
    });
  });

  describe('getDateRange', () => {
    it('should return all dates in range', () => {
      const dates = getDateRange('2025-08-16' as any, '2025-08-18' as any);
      expect(dates).toHaveLength(3);
      expect(dates[0]).toBe('2025-08-16');
      expect(dates[2]).toBe('2025-08-18');
    });
  });
});

