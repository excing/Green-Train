/**
 * 房间ID工具测试
 */

import { describe, it, expect } from 'vitest';
import {
  generateRoomIds,
  generateGlobalRoomId,
  generateCarriageRoomId,
  generateRowRoomId,
  generateSeatRoomId,
  isValidRoomId,
  parseRoomId
} from '../room';
import type { Train } from '$lib/types';

describe('Room Utils', () => {
  const mockTrain: Train = {
    id: 'K7701',
    name: 'K7701',
    theme: '聊聊诺兰的新电影',
    timezone: 'Asia/Shanghai',
    status: 'active',
    carriages: 10,
    rows_per_carriage: 20,
    departure_time: '08:35+00' as any,
    service_days: [1, 3, 5],
    sales_close_before_departure_minutes: 10,
    stations: [
      { name: '起始站', departure_time: '08:35+00' as any },
      { name: '中间站', arrival_time: '09:10+00' as any, departure_time: '09:15+00' as any },
      { name: '终点站', arrival_time: '09:45+00' as any }
    ]
  };

  describe('generateRoomIds', () => {
    it('should generate all room IDs correctly', () => {
      const result = generateRoomIds(mockTrain, '2025-08-16' as any, 2, 3, 7, 'D');

      expect(result.global).toContain('train-K7701-2025-08-16-global_');
      expect(result.carriage).toContain('train-K7701-2025-08-16-carriage-3_');
      expect(result.row).toContain('train-K7701-2025-08-16-seat-row-07_');
      expect(result.seat).toContain('train-K7701-2025-08-16-seat-07D_');
      
      // 所有房间ID应该包含到达时间
      expect(result.global).toContain('09:45');
      expect(result.carriage).toContain('09:45');
      expect(result.row).toContain('09:45');
      expect(result.seat).toContain('09:45');
    });

    it('should throw on invalid to_station_index', () => {
      expect(() => generateRoomIds(mockTrain, '2025-08-16' as any, 999, 3, 7, 'D')).toThrow();
    });
  });

  describe('generateGlobalRoomId', () => {
    it('should generate global room ID', () => {
      const result = generateGlobalRoomId(mockTrain, '2025-08-16' as any, 2);

      expect(result).toContain('train-K7701-2025-08-16-global_');
      expect(result).toContain('09:45');
    });
  });

  describe('generateCarriageRoomId', () => {
    it('should generate carriage room ID', () => {
      const result = generateCarriageRoomId(mockTrain, '2025-08-16' as any, 2, 3);

      expect(result).toContain('train-K7701-2025-08-16-carriage-3_');
      expect(result).toContain('09:45');
    });
  });

  describe('generateRowRoomId', () => {
    it('should generate row room ID with padded row number', () => {
      const result = generateRowRoomId(mockTrain, '2025-08-16' as any, 2, 7);

      expect(result).toContain('train-K7701-2025-08-16-seat-row-07_');
      expect(result).toContain('09:45');
    });

    it('should pad single digit row numbers', () => {
      const result = generateRowRoomId(mockTrain, '2025-08-16' as any, 2, 5);

      expect(result).toContain('seat-row-05_');
    });
  });

  describe('generateSeatRoomId', () => {
    it('should generate seat room ID', () => {
      const result = generateSeatRoomId(mockTrain, '2025-08-16' as any, 2, 7, 'D');

      expect(result).toContain('train-K7701-2025-08-16-seat-07D_');
      expect(result).toContain('09:45');
    });

    it('should handle all seat letters', () => {
      const letters: ('A' | 'B' | 'C' | 'D' | 'F')[] = ['A', 'B', 'C', 'D', 'F'];

      for (const letter of letters) {
        const result = generateSeatRoomId(mockTrain, '2025-08-16' as any, 2, 7, letter);
        expect(result).toContain(`seat-07${letter}_`);
      }
    });
  });

  describe('isValidRoomId', () => {
    it('should validate correct room IDs', () => {
      const globalId = generateGlobalRoomId(mockTrain, '2025-08-16' as any, 2);
      expect(isValidRoomId(globalId)).toBe(true);

      const carriageId = generateCarriageRoomId(mockTrain, '2025-08-16' as any, 2, 3);
      expect(isValidRoomId(carriageId)).toBe(true);

      const rowId = generateRowRoomId(mockTrain, '2025-08-16' as any, 2, 7);
      expect(isValidRoomId(rowId)).toBe(true);

      const seatId = generateSeatRoomId(mockTrain, '2025-08-16' as any, 2, 7, 'D');
      expect(isValidRoomId(seatId)).toBe(true);
    });

    it('should reject invalid room IDs', () => {
      expect(isValidRoomId('invalid-room-id')).toBe(false);
      expect(isValidRoomId('train-K7701-2025-08-16-invalid_2025-08-16T09:45:00+08:00')).toBe(false);
    });
  });

  describe('parseRoomId', () => {
    it('should parse global room ID', () => {
      const globalId = generateGlobalRoomId(mockTrain, '2025-08-16' as any, 2);
      const result = parseRoomId(globalId);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('global');
      expect(result?.trainId).toBe('K7701');
      expect(result?.serviceDate).toBe('2025-08-16');
    });

    it('should parse carriage room ID', () => {
      const carriageId = generateCarriageRoomId(mockTrain, '2025-08-16' as any, 2, 3);
      const result = parseRoomId(carriageId);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('carriage');
      expect(result?.carriageNumber).toBe(3);
    });

    it('should parse row room ID', () => {
      const rowId = generateRowRoomId(mockTrain, '2025-08-16' as any, 2, 7);
      const result = parseRoomId(rowId);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('row');
      expect(result?.row).toBe(7);
    });

    it('should parse seat room ID', () => {
      const seatId = generateSeatRoomId(mockTrain, '2025-08-16' as any, 2, 7, 'D');
      const result = parseRoomId(seatId);

      expect(result).not.toBeNull();
      expect(result?.type).toBe('seat');
      expect(result?.row).toBe(7);
      expect(result?.seatLetter).toBe('D');
    });

    it('should return null for invalid room ID', () => {
      const result = parseRoomId('invalid-room-id');
      expect(result).toBeNull();
    });
  });
});

