/**
 * 售票工具测试
 */

import { describe, it, expect } from 'vitest';
import {
  getOpenAt,
  getCloseAt,
  isOnSale,
  getSalesStatus,
  getTimeUntilClose,
  getTimeUntilOpen,
  getSalesWindow
} from '../sales';
import type { Train } from '$lib/types';

describe('Sales Utils', () => {
  const mockTrain: Train = {
    id: 'K7701',
    name: 'K7701',
    theme: '聊聊诺兰的新电影',
    timezone: 'Asia/Shanghai',
    status: 'active',
    carriages: 10,
    rows_per_carriage: 20,
    departure_time: '14:35+00' as any,
    service_days: [1, 3, 5],
    sales_open_rel: '09:00+00' as any,
    sales_close_before_departure_minutes: 10,
    stations: [
      { name: '起始站', departure_time: '14:35+00' as any },
      { name: '终点站', arrival_time: '15:45+00' as any }
    ]
  };

  describe('getOpenAt', () => {
    it('should calculate open time correctly', () => {
      const result = getOpenAt(mockTrain, '2025-08-11' as any);
      expect(result).toContain('2025-08-11');
      expect(result).toContain('09:00');
    });

    it('should return null if no sales_open_rel', () => {
      const trainNoOpen: Train = {
        ...mockTrain,
        sales_open_rel: undefined
      };

      const result = getOpenAt(trainNoOpen, '2025-08-11' as any);
      expect(result).toBeNull();
    });
  });

  describe('getCloseAt', () => {
    it('should calculate close time correctly', () => {
      const result = getCloseAt(mockTrain, '2025-08-11' as any, 0);
      expect(result).toContain('2025-08-11');
      // 14:35 - 10分钟 = 14:25
      expect(result).toContain('14:25');
    });

    it('should throw on invalid station index', () => {
      expect(() => getCloseAt(mockTrain, '2025-08-11' as any, 999)).toThrow();
    });
  });

  describe('isOnSale', () => {
    it('should return false for paused trains', () => {
      const pausedTrain: Train = {
        ...mockTrain,
        status: 'paused'
      };

      const result = isOnSale(
        pausedTrain,
        '2025-08-11T10:00:00Z' as any,
        '2025-08-11' as any,
        0
      );

      expect(result).toBe(false);
    });

    it('should return false for draft trains', () => {
      const draftTrain: Train = {
        ...mockTrain,
        status: 'draft'
      };

      const result = isOnSale(
        draftTrain,
        '2025-08-11T10:00:00Z' as any,
        '2025-08-11' as any,
        0
      );

      expect(result).toBe(false);
    });

    it('should return false before open time', () => {
      const result = isOnSale(
        mockTrain,
        '2025-08-11T08:00:00+08:00' as any, // 开售前（本地时间）
        '2025-08-11' as any,
        0
      );

      expect(result).toBe(false);
    });

    it('should return false after close time', () => {
      const result = isOnSale(
        mockTrain,
        '2025-08-11T14:26:00+08:00' as any, // 停售后（本地时间，14:35 - 10分钟 = 14:25）
        '2025-08-11' as any,
        0
      );

      expect(result).toBe(false);
    });

    it('should return true during sales window', () => {
      const result = isOnSale(
        mockTrain,
        '2025-08-11T10:00:00+08:00' as any, // 开售后、停售前（本地时间，09:00 < 10:00 < 14:25）
        '2025-08-11' as any,
        0
      );

      expect(result).toBe(true);
    });
  });

  describe('getSalesStatus', () => {
    it('should return paused for paused trains', () => {
      const pausedTrain: Train = {
        ...mockTrain,
        status: 'paused'
      };

      const result = getSalesStatus(
        pausedTrain,
        '2025-08-11T10:00:00+08:00' as any,
        '2025-08-11' as any,
        0
      );

      expect(result).toBe('paused');
    });

    it('should return not_started before open time', () => {
      const result = getSalesStatus(
        mockTrain,
        '2025-08-11T08:00:00+08:00' as any,
        '2025-08-11' as any,
        0
      );

      expect(result).toBe('not_started');
    });

    it('should return closed after close time', () => {
      const result = getSalesStatus(
        mockTrain,
        '2025-08-11T14:26:00+08:00' as any,
        '2025-08-11' as any,
        0
      );

      expect(result).toBe('closed');
    });

    it('should return available during sales window', () => {
      const result = getSalesStatus(
        mockTrain,
        '2025-08-11T10:00:00+08:00' as any,
        '2025-08-11' as any,
        0
      );

      expect(result).toBe('available');
    });
  });

  describe('getTimeUntilClose', () => {
    it('should calculate time until close', () => {
      const result = getTimeUntilClose(
        mockTrain,
        '2025-08-11T10:00:00+08:00' as any,
        '2025-08-11' as any,
        0
      );

      expect(result).toBeGreaterThan(0);
    });

    it('should return 0 if already closed', () => {
      const result = getTimeUntilClose(
        mockTrain,
        '2025-08-11T14:26:00+08:00' as any,
        '2025-08-11' as any,
        0
      );

      expect(result).toBe(0);
    });
  });

  describe('getTimeUntilOpen', () => {
    it('should calculate time until open', () => {
      const result = getTimeUntilOpen(
        mockTrain,
        '2025-08-11T08:00:00+08:00' as any,
        '2025-08-11' as any
      );

      expect(result).toBeGreaterThan(0);
    });

    it('should return null if no open time', () => {
      const trainNoOpen: Train = {
        ...mockTrain,
        sales_open_rel: undefined
      };

      const result = getTimeUntilOpen(
        trainNoOpen,
        '2025-08-11T08:00:00+08:00' as any,
        '2025-08-11' as any
      );

      expect(result).toBeNull();
    });
  });

  describe('getSalesWindow', () => {
    it('should return sales window', () => {
      const result = getSalesWindow(mockTrain, '2025-08-11' as any, 0);

      expect(result.openAt).toBeDefined();
      expect(result.closeAt).toBeDefined();
      expect(result.openAt).toContain('09:00');
      expect(result.closeAt).toContain('14:25');
    });
  });
});

