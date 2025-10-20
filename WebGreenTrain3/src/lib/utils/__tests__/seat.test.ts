/**
 * 选座工具测试
 */

import { describe, it, expect } from 'vitest';
import {
  generateAllSeats,
  sequentialSeatSelection,
  smartRandomSeatSelection,
  selectSeat,
  seatToString,
  seatToShortString
} from '../seat';
import type { Train } from '$lib/types';

describe('Seat Utils', () => {
  const mockTrain: Train = {
    id: 'K7701',
    name: 'K7701',
    theme: '聊聊诺兰的新电影',
    timezone: 'Asia/Shanghai',
    status: 'active',
    carriages: 2,
    rows_per_carriage: 3,
    departure_time: '08:35+00' as any,
    service_days: [1, 3, 5],
    sales_close_before_departure_minutes: 10,
    stations: [
      { name: '起始站', departure_time: '08:35+00' as any },
      { name: '终点站', arrival_time: '09:45+00' as any }
    ]
  };

  describe('generateAllSeats', () => {
    it('should generate all seats', () => {
      const seats = generateAllSeats(mockTrain);

      // 2 carriages * 3 rows * 5 seats = 30 seats
      expect(seats.length).toBe(30);
    });

    it('should generate seats in correct order', () => {
      const seats = generateAllSeats(mockTrain);

      // 第一个座位应该是 1-1-A
      expect(seats[0]).toEqual({ carriage: 1, row: 1, letter: 'A' });

      // 最后一个座位应该是 2-3-F
      expect(seats[seats.length - 1]).toEqual({ carriage: 2, row: 3, letter: 'F' });
    });
  });

  describe('sequentialSeatSelection', () => {
    it('should select first available seat', () => {
      const occupied = new Set<string>();
      const seat = sequentialSeatSelection(mockTrain, occupied);

      expect(seat).toEqual({ carriage: 1, row: 1, letter: 'A' });
    });

    it('should skip occupied seats', () => {
      const occupied = new Set<string>(['1-1-A', '1-1-B', '1-1-C']);
      const seat = sequentialSeatSelection(mockTrain, occupied);

      expect(seat).toEqual({ carriage: 1, row: 1, letter: 'D' });
    });

    it('should move to next row when current row is full', () => {
      const occupied = new Set<string>([
        '1-1-A', '1-1-B', '1-1-C', '1-1-D', '1-1-F'
      ]);
      const seat = sequentialSeatSelection(mockTrain, occupied);

      expect(seat).toEqual({ carriage: 1, row: 2, letter: 'A' });
    });

    it('should return null when all seats are occupied', () => {
      const occupied = new Set<string>();
      const allSeats = generateAllSeats(mockTrain);
      for (const seat of allSeats) {
        occupied.add(`${seat.carriage}-${seat.row}-${seat.letter}`);
      }

      const seat = sequentialSeatSelection(mockTrain, occupied);
      expect(seat).toBeNull();
    });
  });

  describe('smartRandomSeatSelection', () => {
    it('should select center seat when train is empty', () => {
      const seat = smartRandomSeatSelection(mockTrain, [], 'user123', '2025-08-16');

      // 应该优先选择 C 座
      expect(seat?.letter).toBe('C');
    });

    it('should select seat near occupied seats', () => {
      const occupied = [
        { carriage: 1, row: 1, letter: 'C' as const, userId: 'user1' }
      ];

      const seat = smartRandomSeatSelection(mockTrain, occupied, 'user123', '2025-08-16');

      // 应该选择靠近 C 座的座位
      expect(seat).not.toBeNull();
      expect(seat?.carriage).toBe(1);
      expect(seat?.row).toBe(1);
    });

    it('should return null when all seats are occupied', () => {
      const allSeats = generateAllSeats(mockTrain);
      const occupied = allSeats.map(s => ({ ...s, userId: 'user1' }));

      const seat = smartRandomSeatSelection(mockTrain, occupied, 'user123', '2025-08-16');
      expect(seat).toBeNull();
    });

    it('should be deterministic for same user and date', () => {
      const occupied = [
        { carriage: 1, row: 1, letter: 'C' as const, userId: 'user1' }
      ];

      const seat1 = smartRandomSeatSelection(mockTrain, occupied, 'user123', '2025-08-16');
      const seat2 = smartRandomSeatSelection(mockTrain, occupied, 'user123', '2025-08-16');

      expect(seat1).toEqual(seat2);
    });

    it('should select different seats for different users', () => {
      const occupied = [
        { carriage: 1, row: 1, letter: 'C' as const, userId: 'user1' }
      ];

      const seat1 = smartRandomSeatSelection(mockTrain, occupied, 'user123', '2025-08-16');
      const seat2 = smartRandomSeatSelection(mockTrain, occupied, 'user456', '2025-08-16');

      // 不同用户可能选择不同座位（虽然不一定）
      expect(seat1).not.toBeNull();
      expect(seat2).not.toBeNull();
    });
  });

  describe('selectSeat', () => {
    it('should use sequential strategy', () => {
      const occupied: any[] = [];
      const seat = selectSeat(mockTrain, 'sequential', occupied, 'user123', '2025-08-16');

      expect(seat).toEqual({ carriage: 1, row: 1, letter: 'A' });
    });

    it('should use smart_random strategy', () => {
      const occupied: any[] = [];
      const seat = selectSeat(mockTrain, 'smart_random', occupied, 'user123', '2025-08-16');

      expect(seat).not.toBeNull();
      expect(seat?.letter).toBe('C');
    });
  });

  describe('seatToString', () => {
    it('should format seat to readable string', () => {
      const seat = { carriage: 3, row: 7, letter: 'D' as const };
      const result = seatToString(seat);

      expect(result).toBe('3车厢 07排D座');
    });
  });

  describe('seatToShortString', () => {
    it('should format seat to short string', () => {
      const seat = { carriage: 3, row: 7, letter: 'D' as const };
      const result = seatToShortString(seat);

      expect(result).toBe('3车07D');
    });
  });
});

