/**
 * 房间 ID 生成测试
 */

import { describe, it, expect } from 'vitest';
import {
  generateRoomIds,
  parseRoomId,
  generatePNRCode,
  generateJoinToken,
  formatRowNumber,
  parseRowNumber,
  isValidSeatLetter
} from '../room';

describe('Room utilities', () => {
  describe('generateRoomIds', () => {
    it('should generate all room IDs', () => {
      const roomIds = generateRoomIds(
        'K7701',
        '2025-08-16' as any,
        '2025-08-16T09:45:00+08:00' as any,
        3,
        '07',
        'D'
      );

      expect(roomIds.global).toContain('train-K7701-2025-08-16-global_');
      expect(roomIds.carriage).toContain('train-K7701-2025-08-16-carriage-3_');
      expect(roomIds.row).toContain('train-K7701-2025-08-16-seat-row-07_');
      expect(roomIds.seat).toContain('train-K7701-2025-08-16-seat-07D_');
    });
  });

  describe('parseRoomId', () => {
    it('should parse global room ID', () => {
      const roomId = 'train-K7701-2025-08-16-global_2025-08-16T09:45:00+08:00';
      const parsed = parseRoomId(roomId);

      expect(parsed.trainId).toBe('K7701');
      expect(parsed.serviceDate).toBe('2025-08-16');
      expect(parsed.type).toBe('global');
    });

    it('should parse seat room ID', () => {
      const roomId = 'train-K7701-2025-08-16-seat-07D_2025-08-16T09:45:00+08:00';
      const parsed = parseRoomId(roomId);

      expect(parsed.trainId).toBe('K7701');
      expect(parsed.serviceDate).toBe('2025-08-16');
      expect(parsed.type).toBe('seat');
      expect(parsed.rowPadded).toBe('07');
      expect(parsed.seatLetter).toBe('D');
    });
  });

  describe('generatePNRCode', () => {
    it('should generate 8-character PNR code', () => {
      const code = generatePNRCode();
      expect(code).toHaveLength(8);
      expect(/^[A-Z0-9]{8}$/.test(code)).toBe(true);
    });

    it('should generate different codes', () => {
      const code1 = generatePNRCode();
      const code2 = generatePNRCode();
      expect(code1).not.toBe(code2);
    });
  });

  describe('generateJoinToken', () => {
    it('should generate join token', () => {
      const token = generateJoinToken();
      expect(token).toMatch(/^jtk_/);
      expect(token.length).toBeGreaterThan(4);
    });
  });

  describe('formatRowNumber', () => {
    it('should format row number with zero padding', () => {
      expect(formatRowNumber(1)).toBe('01');
      expect(formatRowNumber(7)).toBe('07');
      expect(formatRowNumber(20)).toBe('20');
    });
  });

  describe('parseRowNumber', () => {
    it('should parse row number', () => {
      expect(parseRowNumber('01')).toBe(1);
      expect(parseRowNumber('07')).toBe(7);
      expect(parseRowNumber('20')).toBe(20);
    });
  });

  describe('isValidSeatLetter', () => {
    it('should validate seat letters', () => {
      expect(isValidSeatLetter('A')).toBe(true);
      expect(isValidSeatLetter('B')).toBe(true);
      expect(isValidSeatLetter('C')).toBe(true);
      expect(isValidSeatLetter('D')).toBe(true);
      expect(isValidSeatLetter('F')).toBe(true);
      expect(isValidSeatLetter('E')).toBe(false);
      expect(isValidSeatLetter('G')).toBe(false);
    });
  });
});

