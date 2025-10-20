/**
 * 单车限制检查测试
 */

import { describe, it, expect } from 'vitest';
import {
  hasConflictingTrip,
  getConflictingTickets,
  isUserAlreadyOnTrain,
  getUserTicketsInTimeRange,
  getUserActiveTrips,
  isUserOnTrain,
  getUserCurrentTrain,
  generateConflictMessage
} from '../trip-conflict';
import type { Ticket } from '$lib/types';

describe('Trip Conflict Utils', () => {
  const mockTicket: Ticket = {
    ticket_id: 'tkt_001',
    user_id: 'user123',
    train_id: 'K7701',
    service_date: '2025-08-16' as any,
    timezone: 'Asia/Shanghai' as any,
    from_station_index: 0,
    to_station_index: 2,
    from_station_name: '起始站',
    to_station_name: '终点站',
    carriage_number: 3,
    row: 7,
    seat_letter: 'D',
    depart_abs_local: '2025-08-16T08:35:00+08:00' as any,
    arrival_abs_local: '2025-08-16T09:45:00+08:00' as any,
    depart_abs_utc: '2025-08-16T00:35:00Z' as any,
    arrival_abs_utc: '2025-08-16T01:45:00Z' as any,
    room_ids: {
      global: 'train-K7701-2025-08-16-global_2025-08-16T09:45:00+08:00',
      carriage: 'train-K7701-2025-08-16-carriage-3_2025-08-16T09:45:00+08:00',
      row: 'train-K7701-2025-08-16-seat-row-07_2025-08-16T09:45:00+08:00',
      seat: 'train-K7701-2025-08-16-seat-07D_2025-08-16T09:45:00+08:00'
    },
    room_status: 'open' as any,
    status: 'paid' as any,
    created_at: '2025-08-10T12:00:00Z' as any,
    updated_at: '2025-08-10T12:00:00Z' as any,
    payment: {
      amount_fen: 990,
      currency: 'CNY',
      status: 'paid',
      paid_at: '2025-08-10T12:00:00Z' as any
    },
    train_snapshot: {
      id: 'K7701',
      name: 'K7701',
      theme: '聊聊诺兰的新电影'
    },
    pnr_code: 'PNR8X3Y9Z',
    qrcode_payload: 'https://example.com/join?ticket=tkt_001',
    join_tokens: {}
  };

  describe('hasConflictingTrip', () => {
    it('should detect overlapping trips', () => {
      const userTickets = [mockTicket];
      const newDepartTime = '2025-08-16T00:40:00Z' as any; // 在现有行程中
      const newArrivalTime = '2025-08-16T01:30:00Z' as any;

      const result = hasConflictingTrip(userTickets, newDepartTime, newArrivalTime);
      expect(result).toBe(true);
    });

    it('should not detect non-overlapping trips', () => {
      const userTickets = [mockTicket];
      const newDepartTime = '2025-08-16T02:00:00Z' as any; // 在现有行程之后
      const newArrivalTime = '2025-08-16T03:00:00Z' as any;

      const result = hasConflictingTrip(userTickets, newDepartTime, newArrivalTime);
      expect(result).toBe(false);
    });

    it('should ignore cancelled tickets', () => {
      const cancelledTicket: Ticket = {
        ...mockTicket,
        status: 'cancelled' as any
      };

      const userTickets = [cancelledTicket];
      const newDepartTime = '2025-08-16T00:40:00Z' as any;
      const newArrivalTime = '2025-08-16T01:30:00Z' as any;

      const result = hasConflictingTrip(userTickets, newDepartTime, newArrivalTime);
      expect(result).toBe(false);
    });

    it('should ignore pending_payment tickets', () => {
      const pendingTicket: Ticket = {
        ...mockTicket,
        status: 'pending_payment' as any
      };

      const userTickets = [pendingTicket];
      const newDepartTime = '2025-08-16T00:40:00Z' as any;
      const newArrivalTime = '2025-08-16T01:30:00Z' as any;

      const result = hasConflictingTrip(userTickets, newDepartTime, newArrivalTime);
      expect(result).toBe(false);
    });
  });

  describe('getConflictingTickets', () => {
    it('should return conflicting tickets', () => {
      const userTickets = [mockTicket];
      const newDepartTime = '2025-08-16T00:40:00Z' as any;
      const newArrivalTime = '2025-08-16T01:30:00Z' as any;

      const result = getConflictingTickets(userTickets, newDepartTime, newArrivalTime);
      expect(result.length).toBe(1);
      expect(result[0].ticket_id).toBe('tkt_001');
    });

    it('should return empty array for non-overlapping trips', () => {
      const userTickets = [mockTicket];
      const newDepartTime = '2025-08-16T02:00:00Z' as any;
      const newArrivalTime = '2025-08-16T03:00:00Z' as any;

      const result = getConflictingTickets(userTickets, newDepartTime, newArrivalTime);
      expect(result.length).toBe(0);
    });
  });

  describe('isUserAlreadyOnTrain', () => {
    it('should detect if user is already on train', () => {
      const userTickets = [mockTicket];
      const result = isUserAlreadyOnTrain(userTickets, 'K7701', '2025-08-16');

      expect(result).toBe(true);
    });

    it('should return false for different train', () => {
      const userTickets = [mockTicket];
      const result = isUserAlreadyOnTrain(userTickets, 'D2025', '2025-08-16');

      expect(result).toBe(false);
    });

    it('should return false for different date', () => {
      const userTickets = [mockTicket];
      const result = isUserAlreadyOnTrain(userTickets, 'K7701', '2025-08-17');

      expect(result).toBe(false);
    });

    it('should ignore cancelled tickets', () => {
      const cancelledTicket: Ticket = {
        ...mockTicket,
        status: 'cancelled' as any
      };

      const userTickets = [cancelledTicket];
      const result = isUserAlreadyOnTrain(userTickets, 'K7701', '2025-08-16');

      expect(result).toBe(false);
    });
  });

  describe('getUserTicketsInTimeRange', () => {
    it('should return tickets in time range', () => {
      const userTickets = [mockTicket];
      const startTime = '2025-08-16T00:00:00Z' as any;
      const endTime = '2025-08-16T02:00:00Z' as any;

      const result = getUserTicketsInTimeRange(userTickets, startTime, endTime);
      expect(result.length).toBe(1);
    });

    it('should return empty array for non-overlapping range', () => {
      const userTickets = [mockTicket];
      const startTime = '2025-08-16T02:00:00Z' as any;
      const endTime = '2025-08-16T03:00:00Z' as any;

      const result = getUserTicketsInTimeRange(userTickets, startTime, endTime);
      expect(result.length).toBe(0);
    });
  });

  describe('getUserActiveTrips', () => {
    it('should return active trips', () => {
      const paidTicket: Ticket = { ...mockTicket, status: 'paid' as any };
      const boardedTicket: Ticket = { ...mockTicket, ticket_id: 'tkt_002', status: 'boarded' as any };
      const completedTicket: Ticket = { ...mockTicket, ticket_id: 'tkt_003', status: 'completed' as any };

      const userTickets = [paidTicket, boardedTicket, completedTicket];
      const result = getUserActiveTrips(userTickets);

      expect(result.length).toBe(2);
      expect(result.map(t => t.status)).toContain('paid');
      expect(result.map(t => t.status)).toContain('boarded');
    });

    it('should exclude completed trips', () => {
      const completedTicket: Ticket = { ...mockTicket, status: 'completed' as any };
      const userTickets = [completedTicket];
      const result = getUserActiveTrips(userTickets);

      expect(result.length).toBe(0);
    });
  });

  describe('isUserOnTrain', () => {
    it('should detect if user is on train', () => {
      const boardedTicket: Ticket = { ...mockTicket, status: 'boarded' as any };
      const userTickets = [boardedTicket];

      const result = isUserOnTrain(userTickets);
      expect(result).toBe(true);
    });

    it('should return false if user is not on train', () => {
      const paidTicket: Ticket = { ...mockTicket, status: 'paid' as any };
      const userTickets = [paidTicket];

      const result = isUserOnTrain(userTickets);
      expect(result).toBe(false);
    });
  });

  describe('getUserCurrentTrain', () => {
    it('should return current train', () => {
      const boardedTicket: Ticket = { ...mockTicket, status: 'boarded' as any };
      const userTickets = [boardedTicket];

      const result = getUserCurrentTrain(userTickets);
      expect(result?.ticket_id).toBe('tkt_001');
    });

    it('should return null if user is not on train', () => {
      const paidTicket: Ticket = { ...mockTicket, status: 'paid' as any };
      const userTickets = [paidTicket];

      const result = getUserCurrentTrain(userTickets);
      expect(result).toBeNull();
    });
  });

  describe('generateConflictMessage', () => {
    it('should generate conflict message', () => {
      const conflictingTickets = [mockTicket];
      const result = generateConflictMessage(conflictingTickets);

      expect(result).toContain('K7701');
      expect(result).toContain('无法购票');
    });

    it('should generate default message for empty conflicts', () => {
      const result = generateConflictMessage([]);
      expect(result).toBe('你已在另一趟车上/时间重叠，无法购票');
    });
  });
});

