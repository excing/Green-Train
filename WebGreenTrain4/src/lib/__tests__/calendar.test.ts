/**
 * 运行日计算测试
 */

import { describe, it, expect } from 'vitest';
import { computeServiceDates } from '../calendar';
import type { Train } from '../types';

describe('Calendar utilities', () => {
  const baseTrain: Train = {
    id: 'K7701',
    name: 'K7701',
    theme: 'Test Train',
    timezone: 'Asia/Shanghai',
    status: 'active',
    carriages: 10,
    rows_per_carriage: 20,
    departure_time: '08:35+00' as any,
    sales_close_before_departure_minutes: 10,
    stations: [
      { name: 'Station A', departure_time: '08:35+00' as any },
      { name: 'Station B', arrival_time: '09:45+00' as any }
    ]
  };

  describe('computeServiceDates', () => {
    it('should compute service dates with service_days', () => {
      const train: Train = {
        ...baseTrain,
        service_days: [1, 3, 5] // Mon, Wed, Fri
      };

      const dates = computeServiceDates(train, '2025-08-11' as any, '2025-08-17' as any);
      // 2025-08-11 (Mon), 2025-08-13 (Wed), 2025-08-15 (Fri)
      expect(dates.length).toBeGreaterThan(0);
    });

    it('should handle includes', () => {
      const train: Train = {
        ...baseTrain,
        calendar: {
          includes: ['2025-08-16' as any]
        }
      };

      const dates = computeServiceDates(train, '2025-08-15' as any, '2025-08-17' as any);
      expect(dates).toContain('2025-08-16');
    });

    it('should handle excludes', () => {
      const train: Train = {
        ...baseTrain,
        service_days: [1, 2, 3, 4, 5, 6, 7],
        calendar: {
          excludes: ['2025-08-16' as any]
        }
      };

      const dates = computeServiceDates(train, '2025-08-15' as any, '2025-08-17' as any);
      expect(dates).not.toContain('2025-08-16');
    });

    it('should not generate dates for draft status', () => {
      const train: Train = {
        ...baseTrain,
        status: 'draft',
        service_days: [1, 2, 3, 4, 5, 6, 7]
      };

      const dates = computeServiceDates(train, '2025-08-11' as any, '2025-08-17' as any);
      expect(dates).toHaveLength(0);
    });

    it('should not generate dates for archived status', () => {
      const train: Train = {
        ...baseTrain,
        status: 'archived',
        service_days: [1, 2, 3, 4, 5, 6, 7]
      };

      const dates = computeServiceDates(train, '2025-08-11' as any, '2025-08-17' as any);
      expect(dates).toHaveLength(0);
    });
  });
});

