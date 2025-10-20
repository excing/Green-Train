/**
 * 时间工具测试
 */

import { describe, it, expect } from 'vitest';
import {
  isValidRelativeTime,
  isValidServiceDate,
  parseRelativeTime,
  toLocalAbsoluteTime,
  getTodayInTimezone,
  getWeekday,
  addDays,
  compareDates,
  isDateInRange
} from '../time';

describe('Time Utils', () => {
  describe('isValidRelativeTime', () => {
    it('should validate correct relative time format', () => {
      expect(isValidRelativeTime('08:35+00')).toBe(true);
      expect(isValidRelativeTime('00:40+01')).toBe(true);
      expect(isValidRelativeTime('23:59+02')).toBe(true);
    });

    it('should reject invalid relative time format', () => {
      expect(isValidRelativeTime('24:00+00')).toBe(false);
      expect(isValidRelativeTime('08:60+00')).toBe(false);
      expect(isValidRelativeTime('08:35')).toBe(false);
      expect(isValidRelativeTime('08:35+100')).toBe(false);
    });
  });

  describe('isValidServiceDate', () => {
    it('should validate correct service date format', () => {
      expect(isValidServiceDate('2025-08-16')).toBe(true);
      expect(isValidServiceDate('2025-01-01')).toBe(true);
      expect(isValidServiceDate('2025-12-31')).toBe(true);
    });

    it('should reject invalid service date format', () => {
      expect(isValidServiceDate('2025-13-01')).toBe(false);
      expect(isValidServiceDate('2025-08-32')).toBe(false);
      expect(isValidServiceDate('08-16-2025')).toBe(false);
    });
  });

  describe('parseRelativeTime', () => {
    it('should parse relative time correctly', () => {
      const result = parseRelativeTime('08:35+00' as any);
      expect(result).toEqual({ hours: 8, minutes: 35, days: 0 });
    });

    it('should parse relative time with days offset', () => {
      const result = parseRelativeTime('00:40+01' as any);
      expect(result).toEqual({ hours: 0, minutes: 40, days: 1 });
    });

    it('should throw on invalid format', () => {
      expect(() => parseRelativeTime('invalid' as any)).toThrow();
    });
  });

  describe('toLocalAbsoluteTime', () => {
    it('should convert relative time to absolute time', () => {
      const result = toLocalAbsoluteTime(
        '2025-08-16' as any,
        '08:35+00' as any,
        'Asia/Shanghai' as any
      );
      
      expect(result).toContain('2025-08-16');
      expect(result).toContain('08:35');
      expect(result).toContain('+08:00');
    });

    it('should handle day offset correctly', () => {
      const result = toLocalAbsoluteTime(
        '2025-08-16' as any,
        '00:40+01' as any,
        'Asia/Shanghai' as any
      );
      
      expect(result).toContain('2025-08-17');
      expect(result).toContain('00:40');
    });
  });

  describe('getWeekday', () => {
    it('should return correct weekday', () => {
      // 2025-08-16 是周六
      const weekday = getWeekday('2025-08-16' as any, 'Asia/Shanghai' as any);
      expect(weekday).toBe(6);
    });

    it('should return correct weekday for different dates', () => {
      // 2025-08-18 是周一
      const weekday = getWeekday('2025-08-18' as any, 'Asia/Shanghai' as any);
      expect(weekday).toBe(1);
    });
  });

  describe('addDays', () => {
    it('should add days correctly', () => {
      const result = addDays('2025-08-16' as any, 1);
      expect(result).toBe('2025-08-17');
    });

    it('should handle month boundary', () => {
      const result = addDays('2025-08-31' as any, 1);
      expect(result).toBe('2025-09-01');
    });

    it('should handle negative days', () => {
      const result = addDays('2025-08-16' as any, -1);
      expect(result).toBe('2025-08-15');
    });
  });

  describe('compareDates', () => {
    it('should compare dates correctly', () => {
      expect(compareDates('2025-08-16' as any, '2025-08-17' as any)).toBeLessThan(0);
      expect(compareDates('2025-08-17' as any, '2025-08-16' as any)).toBeGreaterThan(0);
      expect(compareDates('2025-08-16' as any, '2025-08-16' as any)).toBe(0);
    });
  });

  describe('isDateInRange', () => {
    it('should check if date is in range', () => {
      expect(isDateInRange('2025-08-16' as any, '2025-08-15' as any, '2025-08-17' as any)).toBe(true);
      expect(isDateInRange('2025-08-15' as any, '2025-08-15' as any, '2025-08-17' as any)).toBe(true);
      expect(isDateInRange('2025-08-17' as any, '2025-08-15' as any, '2025-08-17' as any)).toBe(true);
      expect(isDateInRange('2025-08-18' as any, '2025-08-15' as any, '2025-08-17' as any)).toBe(false);
    });
  });
});

